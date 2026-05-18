package com.example.receiptscanner.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ReceiptDao {
    @Insert
    suspend fun insert(receipt: Receipt): Long

    @Query("SELECT * FROM receipts ORDER BY date DESC")
    fun observeAll(): Flow<List<Receipt>>

    @Query("SELECT * FROM receipts WHERE merchant LIKE '%' || :query || '%' OR rawText LIKE '%' || :query || '%' ORDER BY date DESC")
    suspend fun search(query: String): List<Receipt>

    @Query("SELECT COALESCE(SUM(amount), 0) FROM receipts WHERE date LIKE :monthPrefix || '%'")
    suspend fun totalForMonth(monthPrefix: String): Long
}
