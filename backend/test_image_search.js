require('dotenv').config();

async function testImageSearch() {
    const guest = { full_name: 'Alina Loekichova' };

    const query = `"${guest.full_name}" LinkedIn profile photo`;
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=10`;

    console.log('Testing image search for:', guest.full_name);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.images_results || data.images_results.length === 0) {
            console.log('No image results found');
            return;
        }

        console.log(`Found ${data.images_results.length} images`);

        // Look for LinkedIn source and profile-displayphoto in the URL
        const bestImage = data.images_results.find(img =>
            (img.source?.toLowerCase().includes('linkedin') || img.link?.includes('linkedin.com')) &&
            (img.original?.includes('profile-displayphoto') || img.original?.includes('media.licdn.com/dms/image'))
        );

        if (bestImage) {
            console.log('✅ Found LinkedIn profile photo:');
            console.log('  Source:', bestImage.source);
            console.log('  URL:', bestImage.original);
        } else {
            console.log('⚠️ No LinkedIn profile photo found, would use first image:');
            console.log('  Source:', data.images_results[0].source);
            console.log('  URL:', data.images_results[0].original);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testImageSearch();
