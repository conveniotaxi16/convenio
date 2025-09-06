const fs = require('fs-extra');
const path = require('path');

exports.handler = async (event) => {
  // Verifique se o método HTTP é POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido.' };
  }

  // Caminho para o arquivo onde os dados serão salvos
  const filePath = path.join('/tmp', 'registros.json');

  try {
    // Obtenha os dados enviados no corpo da requisição
    const novoRegistro = JSON.parse(event.body);

    // Leia os registros existentes ou crie um array vazio se o arquivo não existir
    let registros = [];
    if (await fs.pathExists(filePath)) {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      registros = JSON.parse(fileContent);
    }

    // Adicione o novo registro ao array e salve no arquivo
    registros.push(novoRegistro);
    await fs.writeFile(filePath, JSON.stringify(registros, null, 2), 'utf-8');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Dados salvos com sucesso!' })
    };
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro interno do servidor.' })
    };
  }
};