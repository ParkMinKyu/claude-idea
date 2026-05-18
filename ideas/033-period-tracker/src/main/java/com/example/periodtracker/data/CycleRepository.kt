package com.example.periodtracker.data

import kotlinx.coroutines.flow.Flow
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CycleRepository @Inject constructor(private val dao: CycleDao) {

    fun observeEntries(): Flow<List<CycleEntry>> = dao.observeAll()

    suspend fun logStart(date: LocalDate, flow: Int = 2) {
        dao.insert(CycleEntry(startDate = date.toString(), flowIntensity = flow))
    }

    suspend fun predictNextStart(): LocalDate? {
        val recent = dao.lastN(6).sortedBy { it.startDate }
        if (recent.size < 2) return null
        val dates = recent.map { LocalDate.parse(it.startDate) }
        val gaps = dates.zipWithNext { a, b -> ChronoUnit.DAYS.between(a, b) }
        val avg = gaps.average().toLong().coerceIn(21L, 45L)
        return dates.last().plusDays(avg)
    }

    suspend fun averageCycleLength(): Double {
        val dates = dao.lastN(12).map { LocalDate.parse(it.startDate) }.sorted()
        if (dates.size < 2) return 28.0
        return dates.zipWithNext { a, b -> ChronoUnit.DAYS.between(a, b) }.average()
    }
}
