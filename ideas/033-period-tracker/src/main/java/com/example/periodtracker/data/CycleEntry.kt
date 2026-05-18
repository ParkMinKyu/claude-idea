package com.example.periodtracker.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cycle_entries")
data class CycleEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val startDate: String, // yyyy-MM-dd
    val endDate: String? = null,
    val flowIntensity: Int = 2, // 1..4
    val note: String? = null
)
