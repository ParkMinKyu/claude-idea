package com.example.noisemeter

import com.example.noisemeter.data.NoiseDao
import com.example.noisemeter.data.NoiseRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class NoiseRepositoryTest {

    private val dao = mockk<NoiseDao>(relaxed = true)
    private val repo = NoiseRepository(dao)

    @Test
    fun `pcmToDb returns 0 for empty samples`() {
        assertEquals(0.0, repo.pcmToDb(ShortArray(0)), 0.001)
    }

    @Test
    fun `pcmToDb clamps to 0-130 range`() {
        val loud = ShortArray(1024) { Short.MAX_VALUE }
        val db = repo.pcmToDb(loud)
        assertTrue(db in 0.0..130.0)
    }

    @Test
    fun `save delegates to dao`() = runTest {
        coEvery { dao.insert(any()) } returns 42L
        val id = repo.save(72.5, 37.5, 127.0)
        assertEquals(42L, id)
        coVerify { dao.insert(match { it.db == 72.5 }) }
    }
}
