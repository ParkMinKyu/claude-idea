package com.example.waterreminder.data

import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HydrationRepository @Inject constructor(private val dao: WaterDao) {

    fun observeToday(): Flow<List<WaterIntake>> = dao.observeForDate(today())

    suspend fun addIntake(amountMl: Int, container: String) {
        require(amountMl in 1..3000) { "Unrealistic intake $amountMl" }
        dao.insert(WaterIntake(amountMl = amountMl, containerType = container, date = today()))
    }

    suspend fun totalToday(): Int = dao.totalForDate(today())

    fun calculateDailyGoal(weightKg: Int, activityLevel: Int): Int {
        // 30ml per kg, +activity bonus (0..3)
        val base = weightKg * 30
        val bonus = activityLevel.coerceIn(0, 3) * 250
        return base + bonus
    }

    private fun today(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
}
