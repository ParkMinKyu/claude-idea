package com.example.sleeptracker.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.sqrt

@Singleton
class SleepRepository @Inject constructor(private val dao: SleepDao) {

    fun observeSessions(): Flow<List<SleepSession>> = dao.observeSessions()

    suspend fun startSession(now: Long = System.currentTimeMillis()): Long =
        dao.insertSession(SleepSession(startMillis = now, endMillis = now))

    suspend fun recordMovement(sessionId: Long, x: Float, y: Float, z: Float) {
        val mag = sqrt(x * x + y * y + z * z)
        dao.insertMovement(MovementEvent(sessionId = sessionId,
            timestamp = System.currentTimeMillis(), magnitude = mag))
    }

    /**
     * Classify each minute as deep / light / rem / awake based on movement counts.
     */
    fun classifyStages(movements: List<MovementEvent>, windowMin: Int = 5): Map<String, Int> {
        if (movements.isEmpty()) return mapOf("deep" to 0, "light" to 0, "rem" to 0, "awake" to 0)
        val byBucket = movements.groupBy { it.timestamp / (windowMin * 60_000L) }
        var deep = 0; var light = 0; var rem = 0; var awake = 0
        byBucket.values.forEach { bucket ->
            val avg = bucket.map { it.magnitude }.average()
            when {
                avg < 0.5 -> deep += windowMin
                avg < 1.5 -> light += windowMin
                avg < 3.0 -> rem += windowMin
                else -> awake += windowMin
            }
        }
        return mapOf("deep" to deep, "light" to light, "rem" to rem, "awake" to awake)
    }

    fun computeScore(stages: Map<String, Int>): Int {
        val total = stages.values.sum().coerceAtLeast(1)
        val deepRatio = stages["deep"]!!.toDouble() / total
        val remRatio = stages["rem"]!!.toDouble() / total
        val awakeRatio = stages["awake"]!!.toDouble() / total
        val score = (50 + deepRatio * 30 + remRatio * 25 - awakeRatio * 30).toInt()
        return score.coerceIn(0, 100)
    }
}
