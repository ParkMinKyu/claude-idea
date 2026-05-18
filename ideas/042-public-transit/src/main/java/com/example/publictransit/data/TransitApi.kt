package com.example.publictransit.data

import retrofit2.http.GET
import retrofit2.http.Query

data class ArrivalDto(
    val routeNumber: String,
    val secondsUntilArrival: Int,
    val plate: String? = null
)

data class ArrivalResponse(val arrivals: List<ArrivalDto>)

interface TransitApi {
    @GET("/api/arrivals")
    suspend fun arrivals(@Query("stopId") stopId: String): ArrivalResponse
}
