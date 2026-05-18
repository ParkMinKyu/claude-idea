package com.example.stretchcoach.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StretchRepository @Inject constructor(private val dao: StretchDao) {

    private val library = listOf(
        StretchExercise("neck1", "목 좌우 늘리기", "neck", 60),
        StretchExercise("neck2", "목 회전", "neck", 90),
        StretchExercise("shoulder1", "어깨 으쓱", "shoulder", 60),
        StretchExercise("back1", "허리 비틀기", "back", 90),
        StretchExercise("wrist1", "손목 돌리기", "wrist", 60),
        StretchExercise("leg1", "종아리 늘리기", "leg", 120, premium = true)
    )

    fun observeRecent(): Flow<List<StretchSession>> = dao.observeRecent()

    fun exercisesFor(bodyPart: String? = null, includePremium: Boolean = false): List<StretchExercise> {
        return library.filter {
            (bodyPart == null || it.bodyPart == bodyPart) &&
            (includePremium || !it.premium)
        }
    }

    suspend fun recordSession(exerciseId: String) {
        val ex = library.firstOrNull { it.id == exerciseId } ?: return
        dao.insert(StretchSession(exerciseId = ex.id, bodyPart = ex.bodyPart, durationSec = ex.durationSec))
    }

    suspend fun todayCount(): Int {
        val startOfDay = System.currentTimeMillis().let { it - it % 86_400_000L }
        return dao.countSince(startOfDay)
    }
}
