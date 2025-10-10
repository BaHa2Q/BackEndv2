require('reflect-metadata');
const { DataSource } = require('typeorm');
  
const AppDataSource = new DataSource({
  type: 'oracle',
  username: 'yallabot',
  password: 'just4pal',
  connectString: '185.172.175.7:1521/orclpdb',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/entities/*.js'],
  
});

module.exports = { AppDataSource };
