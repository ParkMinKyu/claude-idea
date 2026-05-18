package com.example.moodjournal.data

import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

data class TagStat(val tag: String, val count: Int)

@Singleton
class MoodRepository @Inject constructor(private val dao: MoodDao) {

    fun observeEntries(): Flow<List<MoodEntry>> = dao.observeAll()

    suspend fun checkIn(score: Int, tags: List<String>, note: String = ""): Long {
        require(score in 1..5) { "Score must be 1..5, got $score" }
        return dao.insert(MoodEntry(
            score = score,
            tags = tags.joinToString(","),
            note = note,
            date = today()
        ))
    }

    suspend fun average7Day(): Double {
        val since = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            .format(Date(System.currentTimeMillis() - 7 * 86_400_000L))
        return dao.averageSince(since) ?: 0.0
    }

    suspend fun topTags(daysBack: Int = 30, topN: Int = 5): List<TagStat> {
        val since = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            .format(Date(System.currentTimeMillis() - daysBack * 86_400_000L))
        val entries = dao.since(since)
        return entries.flatMap { it.tags.split(",") }
            .filter { it.isNotBlank() }
            .groupingBy { it.trim() }
            .eachCount()
            .map { TagStat(it.key, it.value) }
            .sortedByDescending { it.count }
            .take(topN)
    }

    private fun today(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
}
