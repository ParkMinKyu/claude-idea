package com.example.petcare.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pets")
data class Pet(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val species: String, // dog | cat | other
    val breed: String? = null,
    val birthDate: String? = null, // yyyy-MM-dd
    val weightKg: Double? = null,
    val photoPath: String? = null
)

@Entity(tableName = "diary_entries")
data class DiaryEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val petId: Long,
    val date: String,
    val note: String,
    val walkMinutes: Int? = null,
    val foodGram: Int? = null,
    val photoPath: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
