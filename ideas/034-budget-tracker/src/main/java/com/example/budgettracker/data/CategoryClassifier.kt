package com.example.budgettracker.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CategoryClassifier @Inject constructor() {
    private val keywordMap = mapOf(
        "스타벅스" to "카페", "이디야" to "카페", "투썸" to "카페",
        "GS25" to "편의점", "CU" to "편의점", "세븐일레븐" to "편의점",
        "맥도날드" to "식비", "버거킹" to "식비", "롯데리아" to "식비",
        "쿠팡" to "쇼핑", "11번가" to "쇼핑", "지마켓" to "쇼핑",
        "지하철" to "교통", "택시" to "교통", "버스" to "교통", "카카오T" to "교통",
        "올리브영" to "뷰티", "넷플릭스" to "구독", "유튜브" to "구독"
    )

    fun classify(merchant: String): String {
        val match = keywordMap.entries.firstOrNull { merchant.contains(it.key, ignoreCase = true) }
        return match?.value ?: "기타"
    }
}
