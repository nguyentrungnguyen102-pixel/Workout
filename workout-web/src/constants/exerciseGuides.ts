// Form-cue guides for exercises (v2.11.0) — short "how to do it" steps shown
// from an info button on the QuickAdd exercise picker card. Kept deliberately
// short (2-4 steps) and text-only (no images/video — GitHub Pages hosting,
// keep the bundle light). Covers all SYSTEM_PRESETS ids.

export interface ExerciseGuide {
  steps: string[];
  tips?: string[];
}

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  // Strength (bodyweight)
  pushup: {
    steps: [
      'Hai tay rộng hơn vai, thân người thẳng từ đầu đến gót chân',
      'Khuỷu tay gập chếch ~45° so với thân, không xoè ngang',
      'Hạ ngực gần chạm sàn rồi đẩy thẳng tay lên',
    ],
    tips: ['Không võng lưng hoặc chổng mông', 'Siết bụng suốt động tác để giữ thân thẳng'],
  },
  pullup: {
    steps: [
      'Bám xà rộng hơn vai, treo người thẳng tay',
      'Kéo người lên đến khi cằm qua xà, siết vai xuống-ra sau',
      'Hạ người từ từ về vị trí ban đầu, tay duỗi hết cỡ',
    ],
    tips: ['Tránh đu người/lấy đà bằng chân', 'Không thả rơi đột ngột ở pha hạ xuống'],
  },
  squat: {
    steps: [
      'Chân rộng bằng vai, mũi chân hơi mở ra ngoài',
      'Đẩy hông ra sau và hạ xuống như ngồi ghế, lưng thẳng',
      'Đầu gối hướng theo mũi chân, xuống đến khi đùi song song sàn rồi đứng lên',
    ],
    tips: ['Không để đầu gối đổ vào trong', 'Giữ gót chân chạm sàn suốt động tác'],
  },
  lunge: {
    steps: [
      'Bước một chân dài về phía trước, thân người thẳng',
      'Hạ người xuống đến khi cả hai gối gập ~90°',
      'Đẩy gót chân trước để đứng lên, đổi chân',
    ],
    tips: ['Đầu gối trước không vượt quá mũi chân', 'Giữ thân trên thẳng, không đổ người tới trước'],
  },
  burpee: {
    steps: [
      'Squat xuống, chống tay ra sàn rồi bật chân về sau thành plank',
      'Chống đẩy (tuỳ chọn), bật chân về lại tư thế squat',
      'Bật nhảy thẳng lên cao, tay đưa lên trời',
    ],
    tips: ['Giữ lưng thẳng khi bật chân ra/vào, tránh võng lưng thấp'],
  },
  dip: {
    steps: [
      'Hai tay chống lên ghế/bậc, chân duỗi thẳng phía trước',
      'Hạ người xuống bằng cách gập khuỷu tay ra sau, khuỷu ~90°',
      'Đẩy tay để nâng người lên vị trí ban đầu',
    ],
    tips: ['Không hạ quá sâu nếu vai/khuỷu chưa quen', 'Giữ vai xuống, tránh nhún vai lên tai'],
  },

  // Core / Bụng
  plank: {
    steps: [
      'Chống khuỷu tay và mũi chân, thân người tạo thành đường thẳng',
      'Siết bụng và mông, mắt nhìn xuống sàn',
      'Giữ tư thế đủ thời gian, hít thở đều',
    ],
    tips: ['Không võng lưng hoặc chổng mông cao', 'Vai đặt thẳng trên khuỷu tay'],
  },
  crunch: {
    steps: [
      'Nằm ngửa, gối gập, hai tay đặt sau đầu hoặc bắt chéo trước ngực',
      'Dùng cơ bụng cuộn vai và lưng trên rời khỏi sàn',
      'Hạ xuống từ từ, không thả lỏng đột ngột',
    ],
    tips: ['Không kéo cổ bằng tay', 'Chỉ cuộn lưng trên, không cần ngồi hẳn dậy'],
  },
  situp: {
    steps: [
      'Nằm ngửa, gối gập, bàn chân cố định trên sàn',
      'Siết bụng, ngồi dậy đến khi thân trên gần vuông góc với sàn',
      'Hạ xuống từ từ về vị trí ban đầu',
    ],
    tips: ['Không giật người bằng đà', 'Giữ cằm hơi hướng xuống để tránh mỏi cổ'],
  },
  leg_raise: {
    steps: [
      'Nằm ngửa, hai tay đặt dưới mông hoặc cạnh thân để giữ lưng',
      'Giữ chân thẳng, nâng lên vuông góc với sàn',
      'Hạ xuống từ từ, không chạm sàn hẳn giữa các lần lặp',
    ],
    tips: ['Ép lưng dưới xuống sàn để tránh võng lưng'],
  },
  bicycle_crunch: {
    steps: [
      'Nằm ngửa, tay sau đầu, gối gập 90°',
      'Xoay người đưa khuỷu tay chạm gối đối diện, chân kia duỗi thẳng',
      'Đổi bên liên tục theo nhịp đạp xe',
    ],
    tips: ['Xoay bằng cơ bụng chéo, không kéo cổ bằng tay'],
  },
  mountain_climber: {
    steps: [
      'Vào tư thế plank cao, hai tay thẳng dưới vai',
      'Kéo luân phiên từng gối về phía ngực',
      'Giữ nhịp nhanh nhưng thân người ổn định, không nhấp nhô hông',
    ],
    tips: ['Không để mông nhô cao làm mất tư thế plank'],
  },
  russian_twist: {
    steps: [
      'Ngồi, gối gập, ngả thân trên ra sau một góc, giữ lưng thẳng',
      'Hai tay chụm lại, xoay thân sang trái rồi sang phải',
      'Có thể nhấc chân khỏi sàn để tăng độ khó',
    ],
    tips: ['Xoay bằng thân trên, không chỉ vung tay'],
  },
  side_plank: {
    steps: [
      'Nằm nghiêng, chống một khuỷu tay thẳng dưới vai',
      'Nâng hông lên, thân người tạo đường thẳng từ đầu đến chân',
      'Giữ tư thế, siết cơ liên sườn, rồi đổi bên',
    ],
    tips: ['Không để hông võng xuống giữa hiệp'],
  },
  reverse_crunch: {
    steps: [
      'Nằm ngửa, gối gập, hai tay đặt dọc thân hoặc dưới mông',
      'Cuộn hông và gối về phía ngực bằng lực cơ bụng dưới',
      'Hạ chân xuống từ từ, không đá mạnh bằng đà',
    ],
    tips: ['Chuyển động chậm và kiểm soát quan trọng hơn biên độ lớn'],
  },
  v_up: {
    steps: [
      'Nằm ngửa, tay và chân duỗi thẳng',
      'Đồng thời nâng thân trên và chân lên, chạm tay vào mũi chân tạo hình chữ V',
      'Hạ xuống từ từ về tư thế ban đầu',
    ],
    tips: ['Giữ lưng dưới ép sàn nếu chưa nâng được cao, không cần chạm tay-chân ngay từ đầu'],
  },
  flutter_kick: {
    steps: [
      'Nằm ngửa, hai tay đặt dưới mông, chân nâng nhẹ khỏi sàn',
      'Đập chân lên xuống luân phiên với biên độ nhỏ',
      'Giữ lưng dưới ép sàn suốt động tác',
    ],
    tips: ['Nếu đau lưng dưới, nâng chân cao hơn để giảm tải'],
  },
  toe_touch: {
    steps: [
      'Nằm ngửa, chân duỗi thẳng lên trần nhà',
      'Cuộn thân trên lên, vươn tay chạm mũi chân',
      'Hạ xuống từ từ, không dùng đà giật người',
    ],
    tips: ['Dùng cơ bụng để cuộn người, không kéo bằng cổ'],
  },
  ab_wheel: {
    steps: [
      'Quỳ gối, hai tay cầm con lăn đặt trước gối',
      'Lăn thẳng người về phía trước đến hết mức kiểm soát được',
      'Siết bụng kéo con lăn trở lại vị trí quỳ ban đầu',
    ],
    tips: ['Không võng lưng dưới khi lăn ra xa', 'Bắt đầu với biên độ ngắn nếu mới tập'],
  },

  // Cardio
  running: {
    steps: [
      'Khởi động nhẹ vài phút trước khi vào tốc độ chính',
      'Thân người hơi ngả nhẹ về trước, tay đánh tự nhiên theo nhịp chân',
      'Bước chân tiếp đất nhẹ nhàng dưới trọng tâm cơ thể',
    ],
    tips: ['Hít thở đều, tăng tốc độ/quãng đường từ từ qua từng buổi'],
  },
  cycling: {
    steps: [
      'Điều chỉnh yên xe vừa tầm, gối hơi gập khi bàn đạp ở điểm thấp nhất',
      'Giữ lưng thẳng tự nhiên, tay thả lỏng trên ghi-đông',
      'Đạp đều nhịp, tránh gồng cứng vai',
    ],
    tips: ['Kiểm tra phanh và mũ bảo hiểm nếu đạp ngoài trời'],
  },
  jumping_jacks: {
    steps: [
      'Đứng thẳng, hai tay xuôi theo thân',
      'Bật nhảy dang chân rộng bằng vai, đồng thời đưa hai tay lên qua đầu',
      'Bật nhảy trở lại tư thế ban đầu, lặp lại theo nhịp',
    ],
    tips: ['Tiếp đất nhẹ nhàng bằng mũi chân để giảm áp lực lên khớp gối'],
  },
  jump_rope: {
    steps: [
      'Cầm dây vừa tay, khuỷu tay gần thân, chỉ xoay cổ tay',
      'Bật nhảy nhẹ bằng mũi chân, đủ cao để dây luồn qua',
      'Giữ nhịp đều, mắt nhìn thẳng phía trước',
    ],
    tips: ['Tiếp đất êm bằng mũi chân, tránh nhảy quá cao gây mỏi bắp chân'],
  },

  // Mobility
  yoga: {
    steps: [
      'Chọn không gian yên tĩnh, trải thảm và khởi động nhẹ khớp cổ tay/cổ chân',
      'Di chuyển giữa các tư thế chậm rãi, đồng bộ với hơi thở',
      'Giữ mỗi tư thế vài nhịp thở trước khi chuyển tiếp',
    ],
    tips: ['Không cố ép cơ thể vào tư thế gây đau nhói'],
  },
  stretching: {
    steps: [
      'Giãn cơ khi cơ thể đã ấm (sau khi tập hoặc vận động nhẹ)',
      'Giữ mỗi tư thế giãn 15-30 giây, thở đều, không nảy người',
      'Giãn đối xứng cả hai bên cơ thể',
    ],
    tips: ['Chỉ giãn đến mức căng nhẹ, không đau'],
  },

  // Recovery
  walking: {
    steps: [
      'Giữ lưng thẳng, mắt nhìn phía trước, vai thả lỏng',
      'Bước đều, tay đánh nhẹ tự nhiên theo nhịp chân',
      'Tăng dần tốc độ hoặc quãng đường qua các buổi',
    ],
    tips: ['Chọn giày phù hợp để giảm áp lực lên khớp gối/cổ chân'],
  },
  foam_rolling: {
    steps: [
      'Đặt con lăn dưới nhóm cơ cần thư giãn (đùi, lưng, bắp chân...)',
      'Lăn chậm qua lại, dừng lâu hơn ở điểm cơ căng cứng',
      'Thở đều, tránh lăn trực tiếp lên khớp xương',
    ],
    tips: ['Không lăn lên vùng đang đau/viêm cấp tính'],
  },

  // Dumbbell (home training)
  db_bicep_curl: {
    steps: [
      'Đứng thẳng, tay cầm tạ để xuôi hai bên, khuỷu tay sát thân',
      'Gập khuỷu tay cuộn tạ lên vai, chỉ xoay ở khuỷu',
      'Hạ tạ xuống từ từ về vị trí ban đầu',
    ],
    tips: ['Không đung đưa thân người để lấy đà'],
  },
  db_hammer_curl: {
    steps: [
      'Đứng thẳng, cầm tạ theo kiểu "búa" (lòng bàn tay hướng vào thân)',
      'Gập khuỷu tay cuộn tạ lên, khuỷu giữ cố định sát thân',
      'Hạ tạ xuống từ từ, kiểm soát tốc độ',
    ],
    tips: ['Giữ cổ tay thẳng, không bẻ cong khi cuộn tạ'],
  },
  db_tricep_ext: {
    steps: [
      'Đứng hoặc ngồi, hai tay nâng tạ thẳng qua đầu',
      'Gập khuỷu tay hạ tạ ra sau đầu, khuỷu hướng lên trần',
      'Duỗi thẳng tay đưa tạ trở lại vị trí trên đầu',
    ],
    tips: ['Giữ khuỷu tay cố định, không xoè ra hai bên'],
  },
  db_tricep_kick: {
    steps: [
      'Cúi người ra trước, lưng thẳng, cánh tay trên song song sàn',
      'Duỗi thẳng cẳng tay ra sau bằng lực cơ tay sau',
      'Gập khuỷu tay trở lại vị trí ban đầu, kiểm soát chậm',
    ],
    tips: ['Chỉ di chuyển cẳng tay, giữ cánh tay trên bất động'],
  },
  db_shoulder_press: {
    steps: [
      'Đứng hoặc ngồi, tạ nâng ngang vai, lòng bàn tay hướng ra trước',
      'Đẩy thẳng tạ lên trên đầu, không khoá cứng khuỷu tay',
      'Hạ tạ xuống từ từ về vị trí ngang vai',
    ],
    tips: ['Siết bụng để tránh võng lưng khi đẩy tạ lên'],
  },
  db_lateral_raise: {
    steps: [
      'Đứng thẳng, tạ cầm hai bên thân, khuỷu tay hơi gập nhẹ',
      'Nâng tạ sang ngang đến khi cánh tay song song sàn',
      'Hạ tạ xuống từ từ, kiểm soát tốc độ',
    ],
    tips: ['Không dùng đà hất tạ lên, ưu tiên tạ nhẹ đúng kỹ thuật'],
  },
  db_front_raise: {
    steps: [
      'Đứng thẳng, tạ cầm phía trước đùi',
      'Nâng thẳng tay tạ ra trước đến ngang vai',
      'Hạ tạ xuống từ từ về vị trí ban đầu',
    ],
    tips: ['Tránh đung đưa thân người để lấy đà nâng tạ'],
  },
  db_chest_press: {
    steps: [
      'Nằm ngửa trên sàn/ghế, gối gập, mỗi tay cầm một tạ ngang ngực',
      'Đẩy tạ thẳng lên trên, gần khoá khuỷu tay',
      'Hạ tạ xuống từ từ về ngang ngực',
    ],
    tips: ['Giữ lưng dưới áp sát mặt sàn/ghế, không ưỡn quá mức'],
  },
  db_chest_fly: {
    steps: [
      'Nằm ngửa, hai tay cầm tạ duỗi thẳng trên ngực, khuỷu hơi gập',
      'Mở rộng hai tay sang hai bên như ôm vòng cung',
      'Khép tay lại về vị trí trên ngực, siết cơ ngực',
    ],
    tips: ['Giữ khuỷu tay hơi gập cố định suốt động tác để bảo vệ khớp vai'],
  },
  db_bent_row: {
    steps: [
      'Cúi người ra trước, lưng thẳng, gối hơi gập, tạ cầm hai tay buông thẳng',
      'Kéo tạ lên sát hông, khuỷu tay ép sát thân',
      'Hạ tạ xuống từ từ, kiểm soát chuyển động',
    ],
    tips: ['Không cong lưng khi cúi người, giữ cột sống trung tính'],
  },
  db_single_arm_row: {
    steps: [
      'Chống một tay và một gối lên ghế, lưng thẳng song song sàn',
      'Tay còn lại kéo tạ lên sát hông, khuỷu ép sát thân',
      'Hạ tạ xuống từ từ, đổi bên sau khi hết hiệp',
    ],
    tips: ['Không xoay thân để lấy đà kéo tạ'],
  },
  db_goblet_squat: {
    steps: [
      'Ôm tạ trước ngực bằng hai tay, chân rộng hơn vai',
      'Hạ người xuống như squat thường, giữ tạ sát ngực',
      'Đẩy gót chân xuống sàn để đứng lên',
    ],
    tips: ['Giữ lưng thẳng, không để tạ kéo người chúi về trước'],
  },
  db_lunge: {
    steps: [
      'Cầm tạ hai tay xuôi theo thân, bước dài một chân về trước',
      'Hạ người xuống đến khi cả hai gối gập ~90°',
      'Đẩy gót chân trước để đứng lên, đổi chân',
    ],
    tips: ['Đầu gối trước không vượt quá mũi chân'],
  },
  db_sumo_squat: {
    steps: [
      'Đứng chân rộng, mũi chân mở ra ngoài, tạ cầm hai tay trước thân',
      'Hạ người thẳng xuống, đầu gối hướng theo mũi chân',
      'Đẩy gót chân xuống sàn để đứng lên',
    ],
    tips: ['Giữ lưng thẳng, siết mông ở đỉnh động tác'],
  },
  db_rdl: {
    steps: [
      'Đứng thẳng, tạ cầm hai tay trước đùi, gối hơi gập',
      'Đẩy hông ra sau, hạ tạ dọc theo chân, lưng giữ thẳng',
      'Siết mông kéo thân người thẳng dậy trở lại',
    ],
    tips: ['Không cong lưng dưới, tạ luôn sát chân khi hạ xuống'],
  },
  db_deadlift: {
    steps: [
      'Đứng chân rộng bằng hông, tạ đặt sát trước ống chân',
      'Gập hông và gối, lưng thẳng, nắm tạ và đứng thẳng dậy',
      'Hạ tạ xuống theo đúng đường đi đã nâng lên',
    ],
    tips: ['Giữ cột sống trung tính suốt động tác, không tròn lưng'],
  },
  db_hip_thrust: {
    steps: [
      'Lưng trên tựa vào ghế, tạ đặt trên hông, chân co gối vuông góc',
      'Đẩy hông lên cao, siết chặt cơ mông ở đỉnh',
      'Hạ hông xuống từ từ, không chạm sàn hẳn',
    ],
    tips: ['Cằm hơi hướng xuống, tránh ưỡn cổ khi đẩy hông lên'],
  },
  db_arnold_press: {
    steps: [
      'Ngồi hoặc đứng, tạ cầm ngang vai, lòng bàn tay hướng vào thân',
      'Vừa đẩy tạ lên vừa xoay cổ tay ra ngoài đến khi tay duỗi thẳng',
      'Hạ tạ xuống từ từ, xoay ngược lại về vị trí ban đầu',
    ],
    tips: ['Chuyển động xoay cần chậm và kiểm soát, tránh giật khớp vai'],
  },
  db_upright_row: {
    steps: [
      'Đứng thẳng, tạ cầm trước đùi, hai tay gần nhau',
      'Kéo tạ lên dọc theo thân đến ngang ngực, khuỷu tay hướng lên cao',
      'Hạ tạ xuống từ từ về vị trí ban đầu',
    ],
    tips: ['Không kéo tạ quá cao gây khó chịu ở vai'],
  },
  db_reverse_fly: {
    steps: [
      'Cúi người ra trước, lưng thẳng, tạ cầm hai tay buông dưới vai',
      'Mở rộng hai tay sang ngang, siết bả vai lại gần nhau',
      'Hạ tạ xuống từ từ về vị trí ban đầu',
    ],
    tips: ['Giữ khuỷu tay hơi gập cố định, không dùng đà hất tạ'],
  },
  db_farmers_carry: {
    steps: [
      'Cầm 1 tạ mỗi tay, đứng thẳng, vai kéo về sau và xuống',
      'Đi bộ những bước ngắn, đều, giữ thân người thẳng không nghiêng',
      'Siết chặt tay cầm và bụng trong suốt thời gian đi',
    ],
    tips: ['Không đi nhanh — ưu tiên giữ dáng thẳng và tay cầm chắc hơn tốc độ'],
  },
};

export function getGuide(presetId: string): ExerciseGuide | undefined {
  return EXERCISE_GUIDES[presetId];
}
