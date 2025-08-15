
// you can modify the code to suit your needs
window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");

    fetchSalesOrderSummary();

    const form = document.querySelector("form");
    const button = document.querySelector("button");

    function fetchSalesOrderSummary(queryParams = "") {

        fetch(`/dashboard/salesOrderSummary?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (body) {
                if (body.error) throw new Error(body.error);
                // add your own code
            })
            .catch(function (error) {
                console.error(error);
            });
    }

    function handleFormSubmission(event) {
        event.preventDefault();
        // add your own code
    }

    button.addEventListener("click", handleFormSubmission);


});