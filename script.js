// script.js
const form = document.getElementById('registroForm');
const registrosTbody = document.getElementById('registrosTbody');
const totalSpan = document.getElementById('totalSpan');
const mediaSpan = document.getElementById('mediaSpan');
const quantidadeSpan = document.getElementById('quantidadeSpan');

// Função auxiliar para buscar os registros do servidor
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

// Função para salvar os registros no servidor
async function saveRegistro(novoRegistro) {
    try {
        const response = await fetch('/.netlify/functions/dados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoRegistro)
        });
        if (!response.ok) {
            throw new Error('Erro ao salvar o registro no servidor.');
        }
        return true;
    } catch (error) {
        console.error('Erro:', error);
        return false;
    }
}

// Função para remover um registro do servidor
async function removerRegistro(id) {
    try {
        const response = await fetch('/.netlify/functions/dados', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        if (!response.ok) {
            throw new Error('Erro ao remover o registro do servidor.');
        }
        buscarRegistros(); // Atualiza a tabela após a remoção
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Função para buscar e exibir os registros
async function buscarRegistros() {
    const registros = await getRegistros();
    
    registrosTbody.innerHTML = '';
    
    registros.forEach(registro => {
        const tr = document.createElement('tr');
        const dataFormatada = new Date(registro.data_registro).toLocaleString('pt-BR');
        
        tr.innerHTML = `
            <td>${registro.motorista}</td>
            <td>R$ ${parseFloat(registro.valor).toFixed(2).replace('.', ',')}</td>
            <td>${dataFormatada}</td>
            <td>
                <button class="btn btn-danger btn-sm" data-id="${registro.id}">Remover</button>
            </td>
        `;
        registrosTbody.appendChild(tr);
    });

    // Adiciona o evento de clique aos botões de remoção
    document.querySelectorAll('.btn-danger').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.dataset.id);
            removerRegistro(id);
        });
    });

    // Atualiza os resumos (total, média, quantidade)
    const total = registros.reduce((sum, registro) => sum + registro.valor, 0);
    const quantidade = registros.length;
    const media = quantidade > 0 ? total / quantidade : 0;

    totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    mediaSpan.textContent = `R$ ${media.toFixed(2).replace('.', ',')}`;
    quantidadeSpan.textContent = registros.length;
}

// Evento de envio do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const motorista = document.getElementById('motoristaSelect').value;
    const valor = document.getElementById('valorInput').value;
    
    if (!motorista || !valor) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const novoRegistro = {
        id: Date.now(), // Gerar um ID único
        motorista: motorista,
        valor: parseFloat(valor),
        data_registro: new Date().toISOString()
    };
    
    const sucesso = await saveRegistro(novoRegistro);
    if (sucesso) {
        alert('Registro salvo com sucesso!');
        form.reset(); // Limpa o formulário
        buscarRegistros(); // Atualiza a tabela
    }
});

// Carrega os registros quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    buscarRegistros();
});