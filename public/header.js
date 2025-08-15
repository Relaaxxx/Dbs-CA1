function loadHeader() {
    const headerHTML = `
        <header>
            <a href="product/">Product</a>
            <a href="review/">Review</a>
            <a href="cart/">Cart</a>
            <a href="#" onclick="logout()">Logout</a>   
        </header>
    `;

    document.getElementById('header-container').innerHTML = headerHTML;
    adaptLinks();
}

function adaptLinks() {
    let links = document.querySelectorAll("#header-container a");
    links.forEach(link => {
        if (!link.href.includes('#')) {
            let depth = window.location.pathname.split('/').length - 2; // Adjust for folder depth
            let prefix = '../'.repeat(depth);
            link.href = prefix + link.getAttribute("href");
        }
    });
}

// Call loadHeader when the script loads
document.addEventListener("DOMContentLoaded", loadHeader);