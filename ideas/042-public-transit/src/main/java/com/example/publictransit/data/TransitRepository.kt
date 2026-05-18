package com.example.publictransit.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransitRepository @Inject constructor(
    private val dao: StopDao,
    private val api: TransitApi
) {
    fun observeFavorites(): Flow<List<FavoriteStop>> = dao.observeAll()

    suspend fun favorite(stopId: String, name: String, type: String, routes: List<String>) {
        require(stopId.isNotBlank())
        dao.insert(FavoriteStop(stopId = stopId, name = name, type = type,
            routeNumbers = routes.joinToString(",")))
    }

    suspend fun unfavorite(stop: FavoriteStop) = dao.delete(stop)

    suspend fun arrivals(stopId: String): List<ArrivalDto> =
        api.arrivals(stopId).arrivals.sortedBy { it.secondsUntilArrival }

    fun formatEta(seconds: Int): String = when {
        seconds < 60 -> "곧 도착"
        seconds < 600 -> "${seconds / 60}분"
        else -> "${seconds / 60}분 후"
    }
}
