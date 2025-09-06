// script.js
const form = document.getElementById('registroForm');
const registrosTbody = document.getElementById('registrosTbody');
const totalSpan = document.getElementById('totalSpan');
const mediaSpan = document.getElementById('mediaSpan');
const quantidadeSpan = document.getElementById('quantidadeSpan');

// Função para buscar e exibir os registros
async function buscarRegistros() {
    try {
        const response = await fetch('/api/registros');
        const data = await response.json();
        
        registrosTbody.innerHTML = '';
        
        data.registros.forEach(registro => {
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
            button.addEventListener('click', (e) => {
                const registroId = e.target.dataset.id;
                removerRegistro(registroId);
            });
        });

        // Atualiza os totais
        const total = data.registros.reduce((sum, registro) => sum + parseFloat(registro.valor), 0);
        const media = data.registros.length > 0 ? total / data.registros.length : 0;

        totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        mediaSpan.textContent = `R$ ${media.toFixed(2).replace('.', ',')}`;
        quantidadeSpan.textContent = data.registros.length;
        
    } catch (error) {
        console.error('Erro ao buscar os registros:', error);
    }
}

// Função para remover um registro
async function removerRegistro(id) {
    if (confirm('Tem certeza que deseja remover este registro?')) {
        try {
            const response = await fetch(`/api/remover/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Registro removido com sucesso!');
                buscarRegistros(); // Atualiza a tabela
            } else {
                const errorText = await response.text();
                alert(`Erro ao remover: ${errorText}`);
            }
        } catch (error) {
            console.error('Erro ao remover o registro:', error);
            alert('Erro ao conectar ao servidor para remover o registro.');
        }
    }
}

// Evento de envio do formulário (já existente)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const motorista = document.getElementById('motoristaSelect').value;
    const valor = document.getElementById('valorInput').value;
    
    if (!motorista || !valor) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    try {
        const response = await fetch('/api/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motorista, valor })
        });
        
        if (response.ok) {
            alert('Registro salvo com sucesso!');
            form.reset(); // Limpa o formulário
            buscarRegistros(); // Atualiza a tabela
        } else {
            const errorText = await response.text();
            alert(`Erro ao salvar: ${errorText}`);
        }
    } catch (error) {
        console.error('Erro ao salvar o registro:', error);
        alert('Erro ao conectar ao servidor. Verifique se o Node.js está rodando.');
    }
});

// Carrega os registros quando a página é carregada
document.addEventListener('DOMContentLoaded', buscarRegistros);
