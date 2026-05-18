package com.example.stretchcoach.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "stretch_sessions")
data class StretchSession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val exerciseId: String,
    val bodyPart: String,
    val durationSec: Int,
    val timestamp: Long = System.currentTimeMillis()
)

data class StretchExercise(
    val id: String,
    val name: String,
    val bodyPart: String, // neck | shoulder | back | wrist | leg
    val durationSec: Int,
    val videoAsset: String? = null,
    val premium: Boolean = false
)
