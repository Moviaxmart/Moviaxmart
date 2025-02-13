const blogUrl = "https://www.moviaxmart.site"; // Your Blogger site
    const searchBar = document.getElementById("searchBar");
    const searchBtn = document.getElementById("searchBtn");
    const searchResults = document.getElementById("searchResults");
    let cachedPosts = [];

    // Fetch posts once and cache them
    async function fetchPostsFromSitemap() {
        if (cachedPosts.length > 0) return cachedPosts;

        let response = await fetch(`${blogUrl}/sitemap.xml`);
        let text = await response.text();
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(text, "text/xml");
        let urls = [...xmlDoc.getElementsByTagName("loc")];

        cachedPosts = await Promise.all(urls.map(async url => {
            let postUrl = url.textContent;
            let title = postUrl.split("/").pop().replace(/-/g, " ");
            let image = await fetchImageFromPost(postUrl);
            return { title, url: postUrl, image };
        }));

        return cachedPosts;
    }

    // Fetch image from the post URL
    async function fetchImageFromPost(postUrl) {
        try {
            let response = await fetch(postUrl);
            let text = await response.text();
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let img = doc.querySelector("article img, .post-body img");

            return img ? img.src : "https://via.placeholder.com/50";
        } catch (error) {
            return "https://via.placeholder.com/50";
        }
    }

    // Perform live search
    function performSearch(query, posts) {
        searchResults.innerHTML = "";

        if (query.length === 0) {
            searchResults.style.display = "none";
            return;
        }

        let filteredPosts = posts.filter(post => post.title.toLowerCase().includes(query));
        if (filteredPosts.length > 0) {
            searchResults.style.display = "block";
            filteredPosts.forEach(post => {
                let highlightedTitle = post.title.replace(new RegExp(query, "gi"), match => `<strong>${match}</strong>`);
                let li = document.createElement("li");
                li.innerHTML = `<img src="${post.image}" alt="Thumbnail"><div>${highlightedTitle}</div>`;
                li.onclick = () => window.location.href = post.url;
                searchResults.appendChild(li);
            });
        } else {
            searchResults.style.display = "none";
        }
    }

    // Setup search functionality
    async function setupSearch() {
        let posts = await fetchPostsFromSitemap();

        // Start live search automatically on input
        searchBar.addEventListener("input", () => {
            let query = searchBar.value.toLowerCase();
            performSearch(query, posts);
        });

        // Redirect to search page on button click
        searchBtn.addEventListener("click", () => {
            let query = searchBar.value.trim();
            if (query) {
                window.location.href = `${blogUrl}/search?q=${encodeURIComponent(query)}`;
            }
        });

        // Redirect to search page on pressing "Enter"
        searchBar.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                let query = searchBar.value.trim();
                if (query) {
                    window.location.href = `${blogUrl}/search?q=${encodeURIComponent(query)}`;
                }
            }
        });

        // Hide results when clicking outside of the search box
        document.addEventListener("click", function (e) {
            if (!searchBar.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = "none";
            }
        });

        // Start fetching posts immediately
        performSearch("", posts);
    }

    setupSearch();