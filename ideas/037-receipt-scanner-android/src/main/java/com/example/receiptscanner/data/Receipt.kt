package com.example.receiptscanner.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "receipts")
data class Receipt(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val merchant: String,
    val amount: Long,
    val date: String, // yyyy-MM-dd
    val imagePath: String,
    val tag: String? = null,
    val rawText: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
