const db = require('../models');

async function seedThreshold() {
  await db.sequelize.sync();
  
  const count = await db.Threshold.count();
  if (count === 0) {
    await db.Threshold.create({
      info: 0.3,
      suspect: 0.65,
      critique: 1.0
    });
    console.log('✅ Seuil initial inséré.');
  } else {
    console.log('ℹ️ Seuil déjà présent.');
  }

  process.exit();
}

seedThreshold();
