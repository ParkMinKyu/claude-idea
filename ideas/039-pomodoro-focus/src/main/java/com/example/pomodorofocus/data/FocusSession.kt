package com.example.pomodorofocus.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "focus_sessions")
data class FocusSession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val startMillis: Long,
    val endMillis: Long,
    val durationMin: Int,
    val completed: Boolean,
    val tag: String? = null
)
