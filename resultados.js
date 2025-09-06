// resultados.js
const filtroForm = document.getElementById('filtroForm');
const registrosFiltroTbody = document.getElementById('registrosFiltroTbody');
const totalFiltroSpan = document.getElementById('totalFiltroSpan');
const mediaFiltroSpan = document.getElementById('mediaFiltroSpan');
const quantidadeFiltroSpan = document.getElementById('quantidadeFiltroSpan');

const motoristaFiltro = document.getElementById('motoristaFiltro');
const mesFiltro = document.getElementById('mesFiltro');
const anoFiltro = document.getElementById('anoFiltro');

// Referência para o container dos cards de estatísticas
const estatisticasIndividuaisList = document.getElementById('estatisticasIndividuaisList');

// URL do seu servidor back-end. SUBSTITUA POR SUA URL REAL DO RENDER.
const BACKEND_URL = 'https://YOUR_RENDER_URL.onrender.com';

// Função para buscar e exibir os registros filtrados
async function buscarRegistrosFiltrados(motorista, mesAno) {
    try {
        let url = `${BACKEND_URL}/api/registros/filtro?`;
        const params = new URLSearchParams();
        if (motorista) {
            params.append('motorista', motorista);
        }
        if (mesAno) {
            params.append('mes', mesAno);
        }
        url += params.toString();

        const response = await fetch(url);
        const data = await response.json();
        
        registrosFiltroTbody.innerHTML = '';
        
        data.registros.forEach(registro => {
            const tr = document.createElement('tr');
            const dataFormatada = new Date(registro.data_registro).toLocaleString('pt-BR');
            
            tr.innerHTML = `
                <td>${registro.motorista}</td>
                <td>R$ ${parseFloat(registro.valor).toFixed(2).replace('.', ',')}</td>
                <td>${dataFormatada}</td>
            `;
            registrosFiltroTbody.appendChild(tr);
        });

        // Atualiza os totais com base nos dados filtrados
        totalFiltroSpan.textContent = `R$ ${data.total.toFixed(2).replace('.', ',')}`;
        mediaFiltroSpan.textContent = `R$ ${data.media.toFixed(2).replace('.', ',')}`;
        quantidadeFiltroSpan.textContent = data.quantidade;
        
    } catch (error) {
        console.error('Erro ao buscar os registros filtrados:', error);
    }
}

// Nova função para buscar e exibir estatísticas individuais
async function buscarEstatisticasIndividuais(mesAno) {
    try {
        // CORREÇÃO: A URL estava incorreta. Agora aponta para a rota correta do servidor.
        let url = `${BACKEND_URL}/api/registros/estatisticas-individuais?`;
        const params = new URLSearchParams();
        if (mesAno) {
            params.append('mes', mesAno);
        }
        url += params.toString();

        const response = await fetch(url);
        const data = await response.json();
        
        estatisticasIndividuaisList.innerHTML = ''; // Limpa o conteúdo anterior
        
        data.estatisticas.forEach(estatistica => {
            const diferencaFormatada = Math.abs(estatistica.diferenca).toFixed(2).replace('.', ',');
            const totalFormatado = estatistica.total.toFixed(2).replace('.', ',');
            const diferencaTexto = estatistica.diferenca >= 0 ? 
                `+ R$ ${diferencaFormatada}` : 
                `- R$ ${diferencaFormatada}`;
            const diferencaClass = estatistica.diferenca >= 0 ? 'text-success' : 'text-danger';

            const cardHtml = `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${estatistica.motorista}</h5>
                            <p class="card-text fw-bold">Total: R$ ${totalFormatado}</p>
                            <p class="card-text fw-bold ${diferencaClass}">Diferença: ${diferencaTexto}</p>
                        </div>
                    </div>
                </div>
            `;
            estatisticasIndividuaisList.innerHTML += cardHtml;
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas individuais:', error);
    }
}

// Função para popular o select de anos
function popularSelectAnos() {
    const anoAtual = new Date().getFullYear();
    const optionTodos = document.createElement('option');
    optionTodos.value = '';
    optionTodos.textContent = 'Todos os Anos';
    anoFiltro.appendChild(optionTodos);

    // Adiciona os anos de 2023 até o ano atual
    for (let ano = 2023; ano <= anoAtual; ano++) {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        anoFiltro.appendChild(option);
    }
}

// Evento de envio do formulário de filtro
filtroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const motorista = motoristaFiltro.value;
    const mes = mesFiltro.value;
    const ano = anoFiltro.value;

    let mesAno = '';
    if (mes && ano) {
        mesAno = `${ano}-${mes}`;
    }

    buscarRegistrosFiltrados(motorista, mesAno);
    buscarEstatisticasIndividuais(mesAno); // Chama a nova função com o filtro
});

// Carrega os registros quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    popularSelectAnos();
    
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    
    // Filtro inicial para o mês e ano atuais
    mesFiltro.value = mes;
    anoFiltro.value = ano;
    
    buscarRegistrosFiltrados('', `${ano}-${mes}`);
    buscarEstatisticasIndividuais(`${ano}-${mes}`);
});
