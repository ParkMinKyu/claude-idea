package com.example.noisemeter.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.log10
import kotlin.math.sqrt

@Singleton
class NoiseRepository @Inject constructor(private val dao: NoiseDao) {

    fun observeRecent(): Flow<List<NoiseSample>> = dao.observeRecent()

    /**
     * Convert short PCM samples to dBFS-relative SPL estimate.
     * Returns a clamped 0..130 dB value.
     */
    fun pcmToDb(samples: ShortArray, calibrationOffset: Double = 90.0): Double {
        if (samples.isEmpty()) return 0.0
        var sumSquares = 0.0
        for (s in samples) sumSquares += (s.toDouble() * s.toDouble())
        val rms = sqrt(sumSquares / samples.size)
        if (rms <= 0) return 0.0
        val dbFs = 20.0 * log10(rms / Short.MAX_VALUE.toDouble())
        return (dbFs + calibrationOffset).coerceIn(0.0, 130.0)
    }

    suspend fun save(db: Double, lat: Double?, lng: Double?): Long =
        dao.insert(NoiseSample(db = db, latitude = lat, longitude = lng))

    suspend fun markSubmitted(sample: NoiseSample) =
        dao.update(sample.copy(submitted = true))

    suspend fun lastHourAverage(): Double =
        dao.averageSince(System.currentTimeMillis() - 3_600_000L) ?: 0.0
}
