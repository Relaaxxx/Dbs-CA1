function loadAdminHeader() {
    const headerHTML = `
        <header>
            <a href="dashboard/">Dashboard</a>
            <a href="manufacturer/">Manufacturer</a>
            <a href="#" onclick="logout()">Logout</a>   
        </header>
    `;

    document.getElementById('admin-header-container').innerHTML = headerHTML;
    adaptLinks();
}

function adaptLinks() {
    let links = document.querySelectorAll("#admin-header-container a");
    links.forEach(link => {
        if (!link.href.includes('#')) {
            let depth = window.location.pathname.split('/').length - 2; // Adjust for folder depth
            let prefix = '../'.repeat(depth);
            link.href = prefix + 'admin/' + link.getAttribute("href");
        }
    });
}

// Call loadHeader when the script loads
document.addEventListener("DOMContentLoaded", loadAdminHeader);