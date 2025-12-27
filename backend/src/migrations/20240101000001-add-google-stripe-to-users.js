module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'googleId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'profilePicture', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'isEmailVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'paypalSubscriptionId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'subscriptionPlan', {
      type: Sequelize.STRING,
      defaultValue: 'free'
    });

    await queryInterface.addColumn('users', 'subscriptionStatus', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'trialEndsAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'trialStartedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Make password nullable for Google OAuth users
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'googleId');
    await queryInterface.removeColumn('users', 'profilePicture');
    await queryInterface.removeColumn('users', 'isEmailVerified');
    await queryInterface.removeColumn('users', 'paypalSubscriptionId');
    await queryInterface.removeColumn('users', 'subscriptionPlan');
    await queryInterface.removeColumn('users', 'subscriptionStatus');
    await queryInterface.removeColumn('users', 'trialEndsAt');
    await queryInterface.removeColumn('users', 'trialStartedAt');

    // Revert password to not nullable
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
