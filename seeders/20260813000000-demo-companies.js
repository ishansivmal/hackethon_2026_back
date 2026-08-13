'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Companies', [
      {
        name: 'Tech Innovators Inc.',
        email: 'contact@techinnovators.com',
        category: 'Software & IT',
        status: 'Approved',
        website: 'https://techinnovators.com',
        location: 'New York, USA',
        description: 'Leading provider of AI and cloud solutions for modern enterprise infrastructure.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Nexus Security',
        email: 'info@nexussecurity.net',
        category: 'Cybersecurity',
        status: 'Approved',
        website: 'https://nexussecurity.net',
        location: 'London, UK',
        description: 'Specialists in enterprise cybersecurity protocol and auditing.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Green Wave Tech',
        email: 'hello@greenwavetech.io',
        category: 'Green Tech',
        status: 'Pending',
        website: 'https://greenwavetech.io',
        location: 'Berlin, Germany',
        description: 'Building technology for a sustainable tomorrow involving agriculture sensors.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Companies', null, {});
  }
};
