const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra');

const app = express();
const port = process.env.PORT || 3000;
const filePath = path.join(__dirname, 'registros.json');
const motoristasFixos = ['Acassio', 'Bode', 'Claudio', 'Jean', 'Luan', 'Mendonça', 'Victor'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Função para ler o arquivo de registros
async function lerRegistros() {
    if (await fs.pathExists(filePath)) {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        try {
            return JSON.parse(fileContent);
        } catch (e) {
            console.error('Erro ao fazer o parse do JSON:', e);
            return [];
        }
    }
    return [];
}

// Rota para salvar um novo registro
app.post('/api/registrar', async (req, res) => {
    const { motorista, valor } = req.body;
    if (!motorista || !valor) {
        return res.status(400).send('Motorista e valor são obrigatórios.');
    }

    try {
        const registros = await lerRegistros();
        const novoRegistro = {
            id: Date.now().toString(),
            motorista,
            valor: parseFloat(valor),
            data_registro: new Date().toISOString()
        };
        registros.push(novoRegistro);
        await fs.writeFile(filePath, JSON.stringify(registros, null, 2), 'utf-8');
        res.status(200).send('Registro salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar o registro:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para buscar todos os registros
app.get('/api/registros', async (req, res) => {
    try {
        const registros = await lerRegistros();
        const totalGeral = registros.reduce((sum, r) => sum + r.valor, 0);
        const mediaGeral = totalGeral > 0 ? (totalGeral / 7) : 0;
        const quantidadeRegistros = registros.length;
        res.json({ registros, total: totalGeral, media: mediaGeral, quantidade: quantidadeRegistros });
    } catch (error) {
        console.error('Erro ao buscar os registros:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para buscar registros filtrados
app.get('/api/registros/filtro', async (req, res) => {
    try {
        const { motorista, mes } = req.query;
        const registros = await lerRegistros();
        
        let registrosFiltrados = registros;

        if (motorista) {
            registrosFiltrados = registrosFiltrados.filter(reg => reg.motorista === motorista);
        }
        if (mes) {
            registrosFiltrados = registrosFiltrados.filter(reg => {
                const dataRegistro = new Date(reg.data_registro);
                const mesAnoRegistro = `${dataRegistro.getFullYear()}-${(dataRegistro.getMonth() + 1).toString().padStart(2, '0')}`;
                return mesAnoRegistro === mes;
            });
        }
        
        const totalFiltro = registrosFiltrados.reduce((sum, r) => sum + r.valor, 0);
        const mediaFiltro = totalFiltro > 0 ? (totalFiltro / 7) : 0;
        const quantidadeFiltro = registrosFiltrados.length;
        
        res.json({ registros: registrosFiltrados, total: totalFiltro, media: mediaFiltro, quantidade: quantidadeFiltro });

    } catch (error) {
        console.error('Erro ao buscar os registros filtrados:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para buscar estatísticas
app.get('/api/estatisticas', async (req, res) => {
    try {
        const { mes } = req.query;
        let registros = await lerRegistros();

        if (mes) {
            registros = registros.filter(reg => {
                const dataRegistro = new Date(reg.data_registro);
                const mesAnoRegistro = `${dataRegistro.getFullYear()}-${(dataRegistro.getMonth() + 1).toString().padStart(2, '0')}`;
                return mesAnoRegistro === mes;
            });
        }

        const totalGeral = registros.reduce((sum, r) => sum + r.valor, 0);
        const mediaGeral = totalGeral > 0 ? (totalGeral / motoristasFixos.length) : 0;
        
        const estatisticasPorMotorista = motoristasFixos.map(motoristaNome => {
            const total = registros.filter(r => r.motorista === motoristaNome).reduce((sum, r) => sum + r.valor, 0);
            const diferenca = total - mediaGeral;
            return {
                motorista: motoristaNome,
                total: total,
                diferenca: diferenca
            };
        });
        
        res.json({ estatisticas: estatisticasPorMotorista, mediaGeral });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para remover um registro
app.delete('/api/remover', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('ID do registro é obrigatório.');
    }
    
    try {
        let registros = await lerRegistros();
        const registrosAtualizados = registros.filter(reg => reg.id !== id);
        
        if (registros.length === registrosAtualizados.length) {
            return res.status(404).send('Registro não encontrado.');
        }

        await fs.writeFile(filePath, JSON.stringify(registrosAtualizados, null, 2), 'utf-8');
        res.status(200).send('Registro removido com sucesso!');

    } catch (error) {
        console.error('Erro ao remover o registro:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});