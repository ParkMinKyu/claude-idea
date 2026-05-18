package com.example.plantcare.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PlantRepository @Inject constructor(private val dao: PlantDao) {

    fun observePlants(): Flow<List<Plant>> = dao.observePlants()

    suspend fun addPlant(name: String, species: String, intervalDays: Int): Long =
        dao.insert(Plant(name = name, species = species,
            wateringIntervalDays = intervalDays.coerceAtLeast(1)))

    suspend fun water(plantId: Long, now: Long = System.currentTimeMillis()) {
        val plant = dao.getById(plantId) ?: return
        dao.update(plant.copy(lastWateredMillis = now))
        dao.insertLog(CareLog(plantId = plantId, action = "water", timestamp = now))
    }

    fun daysUntilWatering(plant: Plant, now: Long = System.currentTimeMillis()): Int {
        if (plant.lastWateredMillis == 0L) return 0
        val elapsed = (now - plant.lastWateredMillis) / 86_400_000L
        return (plant.wateringIntervalDays - elapsed).toInt()
    }
}
