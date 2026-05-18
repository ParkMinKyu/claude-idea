package com.example.publictransit

import com.example.publictransit.data.ArrivalDto
import com.example.publictransit.data.ArrivalResponse
import com.example.publictransit.data.StopDao
import com.example.publictransit.data.TransitApi
import com.example.publictransit.data.TransitRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class TransitRepositoryTest {
    private val dao = mockk<StopDao>(relaxed = true)
    private val api = mockk<TransitApi>()
    private val repo = TransitRepository(dao, api)

    @Test
    fun `favorite rejects blank stopId`() = runTest {
        assertFailsWith<IllegalArgumentException> {
            repo.favorite("", "n", "bus", listOf("100"))
        }
    }

    @Test
    fun `favorite inserts FavoriteStop with joined routes`() = runTest {
        repo.favorite("S1", "강남역", "bus", listOf("146", "740"))
        coVerify { dao.insert(match { it.routeNumbers == "146,740" }) }
    }

    @Test
    fun `arrivals sorts by seconds ascending`() = runTest {
        coEvery { api.arrivals("S1") } returns ArrivalResponse(listOf(
            ArrivalDto("146", 300),
            ArrivalDto("740", 60)
        ))
        val sorted = repo.arrivals("S1")
        assertEquals("740", sorted.first().routeNumber)
    }

    @Test
    fun `formatEta thresholds`() {
        assertEquals("곧 도착", repo.formatEta(30))
        assertEquals("3분", repo.formatEta(180))
        assertEquals("12분 후", repo.formatEta(720))
    }
}
