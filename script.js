// script.js
const form = document.getElementById('registroForm');
const registrosTbody = document.getElementById('registrosTbody');
const totalSpan = document.getElementById('totalSpan');
const mediaSpan = document.getElementById('mediaSpan');
const quantidadeSpan = document.getElementById('quantidadeSpan');

// URL do seu servidor back-end. SUBSTITUA POR SUA URL REAL DO RENDER.
const BACKEND_URL = 'https://YOUR_RENDER_URL.onrender.com';

// Elementos do modal
const modalContainer = document.getElementById('modalContainer');
const modalMessage = document.getElementById('modalMessage');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalOkBtn = document.getElementById('modalOkBtn');

// Mostra o modal de confirmação
function showConfirm(message, onConfirm) {
    modalMessage.textContent = message;
    modalConfirmBtn.style.display = 'inline-block';
    modalCancelBtn.style.display = 'inline-block';
    modalOkBtn.style.display = 'none';
    modalContainer.style.display = 'flex';

    return new Promise((resolve) => {
        modalConfirmBtn.onclick = () => {
            modalContainer.style.display = 'none';
            resolve(true);
        };
        modalCancelBtn.onclick = () => {
            modalContainer.style.display = 'none';
            resolve(false);
        };
    });
}

// Mostra o modal de alerta
function showAlert(message) {
    modalMessage.textContent = message;
    modalConfirmBtn.style.display = 'none';
    modalCancelBtn.style.display = 'none';
    modalOkBtn.style.display = 'inline-block';
    modalContainer.style.display = 'flex';

    return new Promise((resolve) => {
        modalOkBtn.onclick = () => {
            modalContainer.style.display = 'none';
            resolve();
        };
    });
}

// Função para buscar e exibir os registros
async function buscarRegistros() {
    try {
        // CORREÇÃO: A rota para buscar registros deve ser /api/registros e é um GET
        const response = await fetch(`${BACKEND_URL}/api/registros`);
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
                    <button class="btn btn-danger btn-sm" data-id="${registro._id}">Remover</button>
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
        totalSpan.textContent = `R$ ${data.total.toFixed(2).replace('.', ',')}`;
        mediaSpan.textContent = `R$ ${data.media.toFixed(2).replace('.', ',')}`;
        quantidadeSpan.textContent = data.quantidade;
        
    } catch (error) {
        console.error('Erro ao buscar os registros:', error);
        showAlert('Erro ao buscar os registros.');
    }
}

// Função para remover um registro
async function removerRegistro(id) {
    const isConfirmed = await showConfirm('Tem certeza que deseja remover este registro?');

    if (isConfirmed) {
        try {
            // CORREÇÃO: A rota para remover é /api/remover e espera o ID no corpo da requisição (body)
            const response = await fetch(`${BACKEND_URL}/api/remover`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: id })
            });
            
            if (response.ok) {
                await showAlert('Registro removido com sucesso!');
                buscarRegistros(); // Atualiza a tabela
            } else {
                const errorText = await response.text();
                await showAlert(`Erro ao remover: ${errorText}`);
            }
        } catch (error) {
            console.error('Erro ao remover o registro:', error);
            await showAlert('Erro ao conectar ao servidor para remover o registro.');
        }
    }
}

// Evento de envio do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const motorista = document.getElementById('motoristaSelect').value;
    const valor = document.getElementById('valorInput').value;
    
    if (!motorista || !valor) {
        await showAlert('Por favor, preencha todos os campos.');
        return;
    }
    
    try {
        // CORREÇÃO: Usando a URL completa do back-end para registrar
        const response = await fetch(`${BACKEND_URL}/api/registrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motorista, valor })
        });
        
        if (response.ok) {
            await showAlert('Registro salvo com sucesso!');
            form.reset(); // Limpa o formulário
            buscarRegistros(); // Atualiza a tabela
        } else {
            const errorText = await response.text();
            await showAlert(`Erro ao salvar: ${errorText}`);
        }
    } catch (error) {
        console.error('Erro ao salvar o registro:', error);
        await showAlert('Erro ao conectar ao servidor. Verifique se o Node.js está rodando.');
    }
});

// Carrega os registros quando a página é carregada
document.addEventListener('DOMContentLoaded', buscarRegistros);
