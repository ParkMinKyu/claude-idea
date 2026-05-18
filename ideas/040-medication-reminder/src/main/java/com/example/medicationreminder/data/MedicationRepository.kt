package com.example.medicationreminder.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MedicationRepository @Inject constructor(private val dao: MedicationDao) {

    fun observeMeds(): Flow<List<Medication>> = dao.observeAll()

    suspend fun addMedication(name: String, doseMg: Double, timesPerDay: Int, stock: Int): Long {
        require(timesPerDay in 1..6) { "timesPerDay must be 1..6" }
        require(stock >= 0)
        return dao.insert(Medication(name = name, doseMg = doseMg,
            timesPerDay = timesPerDay, stockCount = stock))
    }

    suspend fun recordIntake(medId: Long) {
        val med = dao.getById(medId) ?: return
        dao.insertLog(IntakeLog(medicationId = medId))
        dao.update(med.copy(stockCount = (med.stockCount - 1).coerceAtLeast(0)))
    }

    suspend fun lowStockMedications(): List<Medication> = dao.lowStock()

    fun nextDoseTimes(med: Medication): List<Int> {
        // Compute evenly spaced hour-of-day slots.
        val intervalH = 24 / med.timesPerDay
        return (0 until med.timesPerDay).map { (med.firstHourOfDay + it * intervalH) % 24 }
    }
}
