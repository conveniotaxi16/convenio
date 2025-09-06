// resultados.js
const filtroForm = document.getElementById('filtroForm');
const registrosFiltroTbody = document.getElementById('registrosFiltroTbody');
const totalFiltroSpan = document.getElementById('totalFiltroSpan');
const mediaFiltroSpan = document.getElementById('mediaFiltroSpan');
const quantidadeFiltroSpan = document.getElementById('quantidadeFiltroSpan');
const motoristaFiltro = document.getElementById('motoristaFiltro');
const mesFiltro = document.getElementById('mesFiltro');
const anoFiltro = document.getElementById('anoFiltro');

const estatisticasIndividuaisList = document.getElementById('estatisticasIndividuaisList');

// Array fixo de motoristas
const motoristasFixos = [
    "Acassio", "Bode", "Claudio", "Jean", "Luan", "Mendonça", "Victor"
];

// Função auxiliar para obter os registros do servidor
async function getRegistros() {
    try {
        const response = await fetch('/.netlify/functions/dados', {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar os registros.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

// Função para buscar e exibir os registros filtrados
async function buscarRegistrosFiltrados(motorista, mes, ano) {
    const registros = await getRegistros();

    const registrosFiltrados = registros.filter(registro => {
        const dataRegistro = new Date(registro.data_registro);
        const registroAno = dataRegistro.getFullYear();
        const registroMes = (dataRegistro.getMonth() + 1).toString().padStart(2, '0');

        const motoristaMatch = motorista === '' || registro.motorista === motorista;
        const mesMatch = mes === '' || registroMes === mes;
        const anoMatch = ano === '' || registroAno.toString() === ano;

        return motoristaMatch && mesMatch && anoMatch;
    });

    registrosFiltroTbody.innerHTML = '';
    let total = 0;

    registrosFiltrados.forEach(registro => {
        const tr = document.createElement('tr');
        const dataFormatada = new Date(registro.data_registro).toLocaleDateString('pt-BR');
        
        tr.innerHTML = `
            <td>${registro.motorista}</td>
            <td>R$ ${registro.valor.toFixed(2).replace('.', ',')}</td>
            <td>${dataFormatada}</td>
        `;
        registrosFiltroTbody.appendChild(tr);
        total += registro.valor;
    });

    const quantidade = registrosFiltrados.length;
    const media = quantidade > 0 ? total / quantidade : 0;

    totalFiltroSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    mediaFiltroSpan.textContent = `R$ ${media.toFixed(2).replace('.', ',')}`;
    quantidadeFiltroSpan.textContent = quantidade;
}

// Função para buscar e exibir estatísticas individuais
async function buscarEstatisticasIndividuais(mes, ano) {
    const registros = await getRegistros();
    
    estatisticasIndividuaisList.innerHTML = '';

    const registrosFiltrados = registros.filter(registro => {
        const dataRegistro = new Date(registro.data_registro);
        const registroAno = dataRegistro.getFullYear();
        const registroMes = (dataRegistro.getMonth() + 1).toString().padStart(2, '0');
        return (mes === '' || registroMes === mes) && (ano === '' || registroAno.toString() === ano);
    });

    const totalFiltro = registrosFiltrados.reduce((sum, registro) => sum + registro.valor, 0);
    const mediaFiltro = registrosFiltrados.length > 0 ? totalFiltro / registrosFiltrados.length : 0;

    const dadosPorMotorista = {};
    motoristasFixos.forEach(motorista => dadosPorMotorista[motorista] = { total: 0, quantidade: 0 });

    registrosFiltrados.forEach(registro => {
        if (dadosPorMotorista[registro.motorista]) {
            dadosPorMotorista[registro.motorista].total += registro.valor;
            dadosPorMotorista[registro.motorista].quantidade += 1;
        }
    });

    Object.keys(dadosPorMotorista).forEach(motorista => {
        const { total, quantidade } = dadosPorMotorista[motorista];
        const status = total > mediaFiltro ? 'acima' : total < mediaFiltro ? 'abaixo' : 'na';
        const diferenca = Math.abs(total - mediaFiltro).toFixed(2).replace('.', ',');
        const classeCor = status === 'acima' ? 'text-success' : status === 'abaixo' ? 'text-danger' : 'text-info';

        const cardHtml = `
            <div class="col-md-4 mb-4">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title fw-bold">${motorista}</h5>
                        <p class="card-text mb-0">Total: <span class="fw-bold">R$ ${total.toFixed(2).replace('.', ',')}</span></p>
                        <p class="card-text mb-0">Quantidade: <span class="fw-bold">${quantidade}</span></p>
                        <p class="card-text ${classeCor} fw-bold mt-2">Está ${status} da média (R$ ${diferenca})</p>
                    </div>
                </div>
            </div>
        `;
        estatisticasIndividuaisList.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Preenche o campo de seleção de anos
function popularSelectAnos() {
    const anoAtual = new Date().getFullYear();
    const optionTodos = document.createElement('option');
    optionTodos.value = '';
    optionTodos.textContent = 'Todos os Anos';
    anoFiltro.appendChild(optionTodos);

    for (let ano = 2023; ano <= anoAtual; ano++) {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        anoFiltro.appendChild(option);
    }
}

// Evento de envio do formulário de filtro
filtroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const motorista = motoristaFiltro.value;
    const mes = mesFiltro.value;
    const ano = anoFiltro.value;

    buscarRegistrosFiltrados(motorista, mes, ano);
    buscarEstatisticasIndividuais(mes, ano);
});

// Carrega os registros quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    popularSelectAnos();
    
    const hoje = new Date();
    const ano = hoje.getFullYear().toString();
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');

    // Carrega os dados do mês e ano atuais por padrão
    buscarRegistrosFiltrados('', mes, ano); 
    buscarEstatisticasIndividuais(mes, ano);
});