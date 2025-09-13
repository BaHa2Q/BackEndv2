require('reflect-metadata');
const { DataSource } = require('typeorm');
  
const AppDataSource = new DataSource({
  type: 'oracle',
  username: 'arabbot',
  password: 'just4pal',
  connectString: 'localhost:1521/orclpdb',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/entities/*.js'],
  
});

module.exports = { AppDataSource };
