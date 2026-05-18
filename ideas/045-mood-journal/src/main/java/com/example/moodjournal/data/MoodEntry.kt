package com.example.moodjournal.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "mood_entries")
data class MoodEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val score: Int, // 1..5
    val tags: String, // comma-separated
    val note: String = "",
    val date: String, // yyyy-MM-dd
    val createdAt: Long = System.currentTimeMillis()
)
