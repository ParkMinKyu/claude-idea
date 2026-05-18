package com.example.pomodorofocus.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FocusRepository @Inject constructor(private val dao: FocusDao) {

    fun observeSessions(): Flow<List<FocusSession>> = dao.observeAll()

    suspend fun completeSession(durationMin: Int, tag: String? = null,
                                 now: Long = System.currentTimeMillis()): Long {
        require(durationMin in 1..240)
        val start = now - durationMin * 60_000L
        return dao.insert(FocusSession(startMillis = start, endMillis = now,
            durationMin = durationMin, completed = true, tag = tag))
    }

    suspend fun cancelSession(elapsedMin: Int, tag: String? = null,
                               now: Long = System.currentTimeMillis()): Long {
        val start = now - elapsedMin * 60_000L
        return dao.insert(FocusSession(startMillis = start, endMillis = now,
            durationMin = elapsedMin, completed = false, tag = tag))
    }

    suspend fun totalToday(now: Long = System.currentTimeMillis()): Int {
        val startOfDay = now - now % 86_400_000L
        return dao.totalSince(startOfDay)
    }
}
