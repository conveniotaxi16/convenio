const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

// Substitua a string abaixo pela sua Connection String do MongoDB Atlas
const MONGODB_URI = '<SUA_CONNECTION_STRING_AQUI>'; 

const app = express();
const port = process.env.PORT || 3000;
const motoristasFixos = ['Acassio', 'Bode', 'Claudio', 'Jean', 'Luan', 'Mendonça', 'Victor'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Conexão com o MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB Atlas!'))
  .catch(err => console.error('Erro de conexão ao MongoDB:', err));

// Definição do Schema e do Model para os registros
const registroSchema = new mongoose.Schema({
    motorista: String,
    valor: Number,
    data_registro: { type: Date, default: Date.now }
});

const Registro = mongoose.model('Registro', registroSchema);

// Rota para salvar um novo registro
app.post('/api/registrar', async (req, res) => {
    const { motorista, valor } = req.body;
    if (!motorista || !valor) {
        return res.status(400).send('Motorista e valor são obrigatórios.');
    }

    try {
        const novoRegistro = new Registro({ motorista, valor: parseFloat(valor) });
        await novoRegistro.save();
        res.status(201).send('Registro salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar o registro:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para buscar todos os registros
app.get('/api/registros', async (req, res) => {
    try {
        const registros = await Registro.find().sort({ data_registro: -1 });
        const total = registros.reduce((sum, reg) => sum + reg.valor, 0);
        const media = registros.length > 0 ? total / registros.length : 0;
        res.json({ registros, total, media, quantidade: registros.length });
    } catch (error) {
        console.error('Erro ao buscar registros:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para buscar registros filtrados
app.get('/api/registros/filtro', async (req, res) => {
    const { motorista, mes } = req.query;

    let query = {};
    if (motorista) {
        query.motorista = motorista;
    }
    if (mes) {
        const [ano, mesNumero] = mes.split('-');
        const dataInicio = new Date(ano, mesNumero - 1, 1);
        const dataFim = new Date(ano, mesNumero, 1);
        query.data_registro = {
            $gte: dataInicio,
            $lt: dataFim
        };
    }

    try {
        const registros = await Registro.find(query).sort({ data_registro: -1 });
        const total = registros.reduce((sum, reg) => sum + reg.valor, 0);
        const media = registros.length > 0 ? total / registros.length : 0;

        res.json({ registros, total, media, quantidade: registros.length });
    } catch (error) {
        console.error('Erro ao buscar registros filtrados:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para buscar estatísticas por motorista
app.get('/api/registros/estatisticas-individuais', async (req, res) => {
    const { mes } = req.query;
    
    let matchQuery = {};
    if (mes) {
        const [ano, mesNumero] = mes.split('-');
        const dataInicio = new Date(ano, mesNumero - 1, 1);
        const dataFim = new Date(ano, mesNumero, 1);
        matchQuery.data_registro = {
            $gte: dataInicio,
            $lt: dataFim
        };
    }

    try {
        const mediaGeralAgregation = await Registro.aggregate([
            { $match: matchQuery },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]);
        
        const mediaGeral = mediaGeralAgregation.length > 0 ? mediaGeralAgregation[0].total / await Registro.countDocuments(matchQuery) : 0;

        const estatisticasPorMotorista = await Registro.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$motorista', total: { $sum: '$valor' } } },
            { $addFields: { diferenca: { $subtract: ['$total', mediaGeral] } } }
        ]);

        const estatisticasFinal = motoristasFixos.map(motoristaNome => {
            const stats = estatisticasPorMotorista.find(s => s._id === motoristaNome);
            return {
                motorista: motoristaNome,
                total: stats ? stats.total : 0,
                diferenca: stats ? stats.diferenca : -mediaGeral
            };
        });

        res.json({ estatisticas: estat