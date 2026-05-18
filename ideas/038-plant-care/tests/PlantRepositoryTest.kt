package com.example.plantcare

import com.example.plantcare.data.Plant
import com.example.plantcare.data.PlantDao
import com.example.plantcare.data.PlantRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals

class PlantRepositoryTest {
    private val dao = mockk<PlantDao>(relaxed = true)
    private val repo = PlantRepository(dao)

    @Test
    fun `addPlant clamps interval to minimum 1`() = runTest {
        coEvery { dao.insert(any()) } returns 1L
        repo.addPlant("몬스테라", "Monstera", 0)
        coVerify { dao.insert(match { it.wateringIntervalDays == 1 }) }
    }

    @Test
    fun `daysUntilWatering returns 0 if never watered`() {
        val plant = Plant(id = 1, name = "P", species = "S",
            wateringIntervalDays = 7, lastWateredMillis = 0L)
        assertEquals(0, repo.daysUntilWatering(plant))
    }

    @Test
    fun `daysUntilWatering counts elapsed days`() {
        val now = 1_700_000_000_000L
        val twoDaysAgo = now - 2 * 86_400_000L
        val plant = Plant(id = 1, name = "P", species = "S",
            wateringIntervalDays = 7, lastWateredMillis = twoDaysAgo)
        assertEquals(5, repo.daysUntilWatering(plant, now))
    }

    @Test
    fun `water updates plant lastWatered`() = runTest {
        coEvery { dao.getById(any()) } returns Plant(id = 5, name = "P", species = "S",
            wateringIntervalDays = 3)
        repo.water(5, 1_700_000_000_000L)
        coVerify { dao.update(match { it.lastWateredMillis == 1_700_000_000_000L }) }
        coVerify { dao.insertLog(match { it.action == "water" }) }
    }
}
