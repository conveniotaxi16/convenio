const fs = require('fs-extra');
const path = require('path');

exports.handler = async (event) => {
  const filePath = path.join('/tmp', 'registros.json');
  let statusCode = 200;
  let body = '';
  
  try {
    switch (event.httpMethod) {
      case 'POST':
        // Salvar um novo registro
        const novoRegistro = JSON.parse(event.body);
        let registros = [];
        if (await fs.pathExists(filePath)) {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          registros = JSON.parse(fileContent);
        }
        registros.push(novoRegistro);
        await fs.writeFile(filePath, JSON.stringify(registros, null, 2), 'utf-8');
        body = JSON.stringify({ message: 'Registro salvo com sucesso!' });
        break;

      case 'GET':
        // Buscar todos os registros
        if (await fs.pathExists(filePath)) {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          body = fileContent;
        } else {
          body = JSON.stringify([]);
        }
        break;

      case 'DELETE':
        // Remover um registro por ID
        const idParaRemover = JSON.parse(event.body).id;
        let registrosAtuais = [];
        if (await fs.pathExists(filePath)) {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          registrosAtuais = JSON.parse(fileContent);
        }
        
        const registrosAtualizados = registrosAtuais.filter(registro => registro.id !== idParaRemover);
        await fs.writeFile(filePath, JSON.stringify(registrosAtualizados, null, 2), 'utf-8');
        body = JSON.stringify({ message: 'Registro removido com sucesso!' });
        break;

      default:
        statusCode = 405;
        body = 'Método não permitido.';
        break;
    }
  } catch (error) {
    console.error('Erro:', error);
    statusCode = 500;
    body = JSON.stringify({ message: `Erro interno do servidor: ${error.message}` });
  }

  return {
    statusCode,
    body,
  };
};