package com.example.publictransit.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun TransitScreen(viewModel: TransitViewModel) {
    val favorites by viewModel.favorites.collectAsStateWithLifecycle()
    val arrivals by viewModel.arrivals.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("즐겨찾기 정류장", style = MaterialTheme.typography.headlineMedium)
        LazyColumn {
            items(favorites, key = { it.stopId }) { stop ->
                LaunchedEffect(stop.stopId) { viewModel.loadArrivals(stop.stopId) }
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Column(Modifier.padding(12.dp)) {
                        Text(stop.alias ?: stop.name)
                        arrivals[stop.stopId]?.take(3)?.forEach {
                            Text("${it.routeNumber}: ${viewModel.eta(it.secondsUntilArrival)}")
                        }
                    }
                }
            }
        }
    }
}
