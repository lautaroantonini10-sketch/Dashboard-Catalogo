let todosLosProductos = [];
let chartInstancia = null;

async function traerProductos() {
    const respuesta = await fetch("https://fakestoreapi.com/products");
    todosLosProductos = await respuesta.json();

    llenarFiltroCategorias(todosLosProductos);
    actualizarDashboard(todosLosProductos);
}

function llenarFiltroCategorias(productos) {
    const categoriasUnicas = [...new Set(productos.map(function(p) { return p.category; }))];
    const contenedor = document.querySelector("#filtro-categoria");

    const pillTodas = document.createElement("button");
    pillTodas.className = "filtro-pill activo";
    pillTodas.textContent = "Todas";
    pillTodas.setAttribute("data-categoria", "todas");
    contenedor.appendChild(pillTodas);

    categoriasUnicas.forEach(function(categoria) {
        const pill = document.createElement("button");
        pill.className = "filtro-pill";
        pill.textContent = categoria;
        pill.setAttribute("data-categoria", categoria);
        contenedor.appendChild(pill);
    });

    contenedor.querySelectorAll(".filtro-pill").forEach(function(pill) {
        pill.addEventListener("click", function() {
            contenedor.querySelectorAll(".filtro-pill").forEach(function(p) {
                p.classList.remove("activo");
            });
            pill.classList.add("activo");

            const seleccion = pill.getAttribute("data-categoria");
            const filtrados = seleccion === "todas"
                ? todosLosProductos
                : todosLosProductos.filter(function(p) { return p.category === seleccion; });
            actualizarDashboard(filtrados);
        });
    });
}


function actualizarDashboard(productos) {
    calcularKPIs(productos);
    graficarPrecioPorCategoria(productos);
    renderizarTabla(productos);
}

function renderizarTabla(productos) {
    const tbody = document.querySelector("#tabla-productos tbody");
    tbody.innerHTML = "";

    productos.forEach(function(producto) {
        const fila = document.createElement("tr");
        fila.innerHTML =
            "<td>" + producto.title + "</td>" +
            "<td>" + producto.category + "</td>" +
            "<td>$" + producto.price.toFixed(2) + "</td>" +
            "<td>" + producto.rating.rate + " ⭐</td>";
        tbody.appendChild(fila);
    });
}

function calcularKPIs(productos) {
    const total = productos.length;

    const sumaPrecios = productos.reduce(function(acumulado, producto) {
        return acumulado + producto.price;
    }, 0);
    const precioPromedio = sumaPrecios / total;

    const conteoPorCategoria = {};
    productos.forEach(function(producto) {
        const categoria = producto.category;
        conteoPorCategoria[categoria] = (conteoPorCategoria[categoria] || 0) + 1;
    });

    let categoriaTop = "";
    let maxCantidad = 0;
    for (const categoria in conteoPorCategoria) {
        if (conteoPorCategoria[categoria] > maxCantidad) {
            maxCantidad = conteoPorCategoria[categoria];
            categoriaTop = categoria;
        }
    }

    const sumaRatings = productos.reduce(function(acumulado, producto) {
        return acumulado + producto.rating.rate;
    }, 0);
    const ratingPromedio = sumaRatings / total;

    document.querySelector("#kpi-total").textContent = total;
    document.querySelector("#kpi-precio-promedio").textContent = "$" + precioPromedio.toFixed(2);
    document.querySelector("#kpi-categoria-top").textContent = categoriaTop;
    document.querySelector("#kpi-rating-promedio").textContent = ratingPromedio.toFixed(1) + " ⭐";


}

function graficarPrecioPorCategoria(productos) {
    if (chartInstancia) {
        chartInstancia.destroy();
    }
    const sumaPorCategoria = {};
    const cantidadPorCategoria = {};

    productos.forEach(function(producto) {
        const categoria = producto.category;
        sumaPorCategoria[categoria] = (sumaPorCategoria[categoria] || 0) + producto.price;
        cantidadPorCategoria[categoria] = (cantidadPorCategoria[categoria] || 0) + 1;
    });

    const categorias = Object.keys(sumaPorCategoria);
    const promedios = categorias.map(function(categoria) {
        return sumaPorCategoria[categoria] / cantidadPorCategoria[categoria];
    });

chartInstancia = new Chart(document.querySelector("#grafico-categorias"), {
    type: "bar",
    data: {
        labels: categorias,
        datasets: [{
            label: "Precio promedio ($)",
            data: promedios,
            backgroundColor: "#22d3ee"
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top"
            }
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: false
                }
            }
        }
    }
}); 
}

traerProductos();
