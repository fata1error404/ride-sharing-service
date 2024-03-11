module.exports = function(sequelize, DataTypes) {
    const rides = sequelize.define('rides', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING,
        destination: DataTypes.STRING,
        date: DataTypes.STRING,
        type: DataTypes.STRING,
        status: DataTypes.STRING,
        passengers: DataTypes.INTEGER,
        price: DataTypes.INTEGER
    });

    return rides;
};
