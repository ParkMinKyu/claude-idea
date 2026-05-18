package com.example.medicationreminder

import com.example.medicationreminder.data.Medication
import com.example.medicationreminder.data.MedicationDao
import com.example.medicationreminder.data.MedicationRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class MedicationRepositoryTest {
    private val dao = mockk<MedicationDao>(relaxed = true)
    private val repo = MedicationRepository(dao)

    @Test
    fun `addMedication rejects invalid timesPerDay`() = runTest {
        assertFailsWith<IllegalArgumentException> {
            repo.addMedication("aspirin", 100.0, 0, 30)
        }
    }

    @Test
    fun `recordIntake decrements stock and never below 0`() = runTest {
        coEvery { dao.getById(any()) } returns Medication(id = 1, name = "M", doseMg = 5.0,
            timesPerDay = 1, stockCount = 1)
        repo.recordIntake(1)
        coVerify { dao.update(match { it.stockCount == 0 }) }
    }

    @Test
    fun `nextDoseTimes spaces evenly across the day`() {
        val med = Medication(id = 1, name = "M", doseMg = 100.0,
            timesPerDay = 3, stockCount = 30, firstHourOfDay = 8)
        assertEquals(listOf(8, 16, 0), repo.nextDoseTimes(med))
    }
}
