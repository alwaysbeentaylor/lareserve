'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './dashboard.module.css';

const ANALYTICS_API = process.env.NEXT_PUBLIC_API_URL || 'https://lareserve-backend.onrender.com';
const REFRESH_INTERVAL = 30000; // 30 seconds

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch(`${ANALYTICS_API}/api/analytics/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
            setLastRefresh(new Date());
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading && !stats) {
        return (
            <div className={styles.dashboardContainer}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className={styles.dashboardContainer}>
                <div className={styles.error}>
                    <p>Error: {error}</p>
                    <button onClick={fetchStats} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { overview, viewsByDay, topPages, eventsByType, recentVisitors, topReferrers } = stats || {};

    return (
        <div className={styles.dashboardContainer}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>📊 Analytics Dashboard</h1>
                    <div className={styles.headerMeta}>
                        <span className={styles.lastUpdate}>
                            Last update: {lastRefresh?.toLocaleTimeString('nl-NL') || '-'}
                        </span>
                        <button onClick={fetchStats} className={styles.refreshBtn}>
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </header>

            {/* Overview Cards */}
            <section className={styles.overviewSection}>
                <div className={styles.statsGrid}>
                    <StatCard
                        icon="👁️"
                        label="Total Views"
                        value={overview?.totalViews || 0}
                        sublabel="All time"
                    />
                    <StatCard
                        icon="👤"
                        label="Unique Visitors"
                        value={overview?.uniqueVisitors || 0}
                        sublabel="All time"
                    />
                    <StatCard
                        icon="📅"
                        label="Views Today"
                        value={overview?.viewsToday || 0}
                        sublabel={`${overview?.visitorsToday || 0} visitors`}
                    />
                    <StatCard
                        icon="📈"
                        label="This Week"
                        value={overview?.viewsThisWeek || 0}
                        sublabel={`${overview?.visitorsThisWeek || 0} visitors`}
                    />
                    <StatCard
                        icon="📩"
                        label="Form Submissions"
                        value={overview?.formSubmissions || 0}
                        sublabel="Contact forms"
                    />
                    <StatCard
                        icon="🖱️"
                        label="CTA Clicks"
                        value={overview?.ctaClicks || 0}
                        sublabel="Button clicks"
                    />
                </div>
            </section>

            {/* Charts Section */}
            <section className={styles.chartsSection}>
                {/* Visitors Chart */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Visitors (Last 30 Days)</h3>
                    <div className={styles.chartContainer}>
                        {viewsByDay && viewsByDay.length > 0 ? (
                            <SimpleLineChart data={viewsByDay} />
                        ) : (
                            <p className={styles.noData}>No data available</p>
                        )}
                    </div>
                </div>

                {/* Event Types */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Events by Type</h3>
                    <div className={styles.eventsList}>
                        {eventsByType && eventsByType.length > 0 ? (
                            eventsByType.map((event, idx) => (
                                <div key={idx} className={styles.eventItem}>
                                    <span className={styles.eventType}>{event.event_type}</span>
                                    <span className={styles.eventCount}>{event.count}</span>
                                </div>
                            ))
                        ) : (
                            <p className={styles.noData}>No events recorded</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Tables Section */}
            <section className={styles.tablesSection}>
                {/* Top Pages */}
                <div className={styles.tableCard}>
                    <h3 className={styles.tableTitle}>Top Pages</h3>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Page</th>
                                <th>Views</th>
                                <th>Visitors</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topPages && topPages.length > 0 ? (
                                topPages.map((page, idx) => (
                                    <tr key={idx}>
                                        <td>{page.page_path || '/'}</td>
                                        <td>{page.views}</td>
                                        <td>{page.visitors}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className={styles.noData}>No data</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Top Referrers */}
                <div className={styles.tableCard}>
                    <h3 className={styles.tableTitle}>Top Referrers</h3>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Visits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topReferrers && topReferrers.length > 0 ? (
                                topReferrers.map((ref, idx) => (
                                    <tr key={idx}>
                                        <td className={styles.referrerUrl}>
                                            {formatReferrer(ref.referrer)}
                                        </td>
                                        <td>{ref.count}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className={styles.noData}>No referrers</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Recent Visitors */}
            <section className={styles.recentSection}>
                <div className={styles.tableCard}>
                    <h3 className={styles.tableTitle}>Recent Visitors</h3>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Visitor</th>
                                <th>Page</th>
                                <th>Referrer</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentVisitors && recentVisitors.length > 0 ? (
                                recentVisitors.map((visitor, idx) => (
                                    <tr key={idx}>
                                        <td className={styles.visitorHash}>
                                            #{visitor.visitor_hash?.substring(0, 8) || 'unknown'}
                                        </td>
                                        <td>{visitor.page_path || '/'}</td>
                                        <td className={styles.referrerUrl}>
                                            {formatReferrer(visitor.referrer) || '-'}
                                        </td>
                                        <td>{formatTime(visitor.visited_at)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className={styles.noData}>No recent visitors</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Auto-refresh indicator */}
            <div className={styles.autoRefreshIndicator}>
                <span className={styles.pulsingDot}></span>
                Auto-refreshing every 30 seconds
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon, label, value, sublabel }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statContent}>
                <span className={styles.statValue}>{value.toLocaleString()}</span>
                <span className={styles.statLabel}>{label}</span>
                {sublabel && <span className={styles.statSublabel}>{sublabel}</span>}
            </div>
        </div>
    );
}

// Simple Line Chart Component
function SimpleLineChart({ data }) {
    const maxViews = Math.max(...data.map(d => d.views), 1);
    const chartHeight = 200;
    const chartWidth = 100; // percentage

    return (
        <div className={styles.lineChart}>
            <div className={styles.chartBars}>
                {data.map((day, idx) => (
                    <div key={idx} className={styles.barContainer}>
                        <div
                            className={styles.bar}
                            style={{ height: `${(day.views / maxViews) * 100}%` }}
                            title={`${day.date}: ${day.views} views, ${day.visitors} visitors`}
                        />
                        {idx % Math.ceil(data.length / 7) === 0 && (
                            <span className={styles.barLabel}>
                                {new Date(day.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                            </span>
                        )}
                    </div>
                ))}
            </div>
            <div className={styles.chartLegend}>
                <span>Total: {data.reduce((sum, d) => sum + d.views, 0)} views</span>
            </div>
        </div>
    );
}

// Helper: Format referrer URL
function formatReferrer(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url.substring(0, 30);
    }
}

// Helper: Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('nl-NL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}
