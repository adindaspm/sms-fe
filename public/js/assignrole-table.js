
if (document.getElementById("roles-table") && typeof simpleDatatables.DataTable !== 'undefined') {
    const dataTable = new simpleDatatables.DataTable("#roles-table", {
        searchable: false,
        perPageSelect: false,
        paging: false
    });
}
