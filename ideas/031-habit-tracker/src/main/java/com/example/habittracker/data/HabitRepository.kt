package com.example.habittracker.data

import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HabitRepository @Inject constructor(private val dao: HabitDao) {

    fun observeHabits(): Flow<List<Habit>> = dao.observeAll()

    suspend fun addHabit(name: String, emoji: String = "✅"): Long =
        dao.insert(Habit(name = name, emoji = emoji))

    suspend fun checkIn(habitId: Long, date: String = today()) {
        dao.insertLog(HabitLog(habitId = habitId, date = date))
    }

    suspend fun isCompletedToday(habitId: Long): Boolean =
        dao.countForDate(habitId, today()) > 0

    suspend fun streakOf(habitId: Long): Int {
        val dates = dao.datesFor(habitId).toSet()
        var streak = 0
        var cursor = Date()
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        while (dates.contains(fmt.format(cursor))) {
            streak++
            cursor = Date(cursor.time - 86_400_000L)
        }
        return streak
    }

    private fun today(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
}
