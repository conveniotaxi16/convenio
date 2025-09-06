// server.js
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Usa a porta do Railway ou a porta 3000 localmente

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Configuração do Banco de Dados usando variáveis de ambiente do Railway
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT // Adicione a porta, se necessário
});

connection.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL.');
});

// Rota para salvar um novo registro
app.post('/api/registrar', (req, res) => {
    const { motorista, valor } = req.body;
    if (!motorista || !valor) {
        return res.status(400).send('Motorista e valor são obrigatórios.');
    }
    const sql = 'INSERT INTO registros (motorista, valor) VALUES (?, ?)';
    connection.query(sql, [motorista, valor], (err, result) => {
        if (err) {
            console.error('Erro ao inserir registro:', err);
            return res.status(500).send('Erro ao salvar o registro.');
        }
        res.status(201).send('Registro salvo com sucesso!');
    });
});

// Rota para buscar todos os registros
app.get('/api/registros', (req, res) => {
    const sql = 'SELECT id, motorista, valor, data_registro FROM registros ORDER BY data_registro DESC';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar registros:', err);
            return res.status(500).send('Erro ao buscar registros.');
        }
        res.json({ registros: results });
    });
});

// Rota para buscar registros filtrados
app.get('/api/registros/filtro', (req, res) => {
    const { motorista, mes } = req.query;
    let sql = 'SELECT id, motorista, valor, data_registro FROM registros WHERE 1=1';
    const params = [];

    if (motorista) {
        sql += ' AND motorista = ?';
        params.push(motorista);
    }
    if (mes) {
        sql += ' AND DATE_FORMAT(data_registro, "%Y-%m") = ?';
        params.push(mes);
    }
    sql += ' ORDER BY data_registro DESC';

    connection.query(sql, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar registros:', err);
            return res.status(500).send('Erro ao buscar registros.');
        }

        const total = results.reduce((sum, row) => sum + parseFloat(row.valor), 0);
        const quantidade = results.length;
        const media = quantidade > 0 ? total / quantidade : 0;

        res.json({
            registros: results,
            total,
            quantidade,
            media
        });
    });
});

// Rota para remover um registro
app.delete('/api/remover/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM registros WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao remover registro:', err);
            return res.status(500).send('Erro ao remover registro.');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Registro não encontrado.');
        }
        res.status(200).send('Registro removido com sucesso!');
    });
});

// Rota para buscar estatísticas por motorista
app.get('/api/estatisticas', (req, res) => {
    const { mes } = req.query;
    let sql = 'SELECT motorista, SUM(valor) AS total FROM registros WHERE 1=1 ' + (mes ? 'AND DATE_FORMAT(data_registro, "%Y-%m") = ?' : '') + ' GROUP BY motorista ORDER BY motorista';
    let params = mes ? [mes] : [];

    // Busca o total geral para o cálculo da média
    let sqlTotalGeral = 'SELECT SUM(valor) AS total_geral FROM registros WHERE 1=1 ' + (mes ? 'AND DATE_FORMAT(data_registro, "%Y-%m") = ?' : '');
    connection.query(sqlTotalGeral, params, (err, totalGeralResult) => {
        if (err) {
            console.error('Erro ao buscar total geral:', err);
            return res.status(500).send('Erro ao buscar estatísticas.');
        }

        const totalGeral = totalGeralResult[0].total_geral || 0;
        const mediaGeral = totalGeral > 0 ? (totalGeral / 7) : 0;
        const motoristasFixos = ['Acassio', 'Bode', 'Claudio', 'Jean', 'Luan', 'Mendonça', 'Victor'];

        connection.query(sql, params, (err, results) => {
            if (err) {
                console.error('Erro ao buscar estatísticas por motorista:', err);
                return res.status(500).send('Erro ao buscar estatísticas.');
            }

            const estatisticasPorMotorista = motoristasFixos.map(motoristaNome => {
                const encontrado = results.find(m => m.motorista === motoristaNome);
                const total = encontrado ? parseFloat(encontrado.total) : 0;
                const diferenca = total - mediaGeral;
                return {
                    motorista: motoristaNome,
                    total: total,
                    diferenca: diferenca
                };
            });
            
            res.json({ estatisticas: estatisticasPorMotorista, mediaGeral });
        });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});