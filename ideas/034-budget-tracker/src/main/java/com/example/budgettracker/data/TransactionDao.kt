package com.example.budgettracker.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Insert
    suspend fun insert(tx: Transaction): Long

    @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
    fun observeAll(): Flow<List<Transaction>>

    @Query("SELECT category, SUM(amount) AS total FROM transactions WHERE date LIKE :monthPrefix || '%' GROUP BY category")
    suspend fun monthlyByCategory(monthPrefix: String): List<CategoryTotal>
}

data class CategoryTotal(val category: String, val total: Long)
