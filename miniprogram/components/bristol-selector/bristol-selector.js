Component({
  properties: {
    selectedType: {
      type: Number,
      value: 4 // 默认4型，最完美健康的形状
    }
  },

  data: {
    typesList: [
      {
        type: 1,
        title: '1型 散状硬球',
        subtitle: '严重便秘',
        emoji: '🌰',
        desc: '像坚果一样，散落的一颗颗硬球，极难排出。说明体内严重缺水、纤维不足，伴有体内火气过剩。',
        color: '#C6A18D',
        textColor: '#FFFFFF'
      },
      {
        type: 2,
        title: '2型 凹凸腊肠',
        subtitle: '轻微便秘',
        emoji: '🪵',
        desc: '呈腊肠状，但表面由许多硬块挤压凸起，凹凸不平。表示饮水较少或缺乏运动，需加强腹部按摩与补水。',
        color: '#B58D70',
        textColor: '#FFFFFF'
      },
      {
        type: 3,
        title: '3型 裂纹腊肠',
        subtitle: '稍微干燥',
        emoji: '🥖',
        desc: '呈条状，表面有浅裂纹，稍微偏干，但属于正常可接受范围。多喝水即可恢复黄金状态。',
        color: '#D4B295',
        textColor: '#4A4A4A'
      },
      {
        type: 4,
        title: '4型 光滑香蕉',
        subtitle: '完美健康',
        emoji: '🍌',
        desc: '呈香蕉状或蛇状，表面光滑且柔软，极易排出。这是最理想、最健康的黄金便便！请继续保持良好的饮食作息。',
        color: '#8FAF9F', // 经典莫兰迪绿
        textColor: '#FFFFFF'
      },
      {
        type: 5,
        title: '5型 软质断块',
        subtitle: '纤维偏少',
        emoji: '🍞',
        desc: '断块状，边缘清晰且柔软，易排出。表示膳食纤维摄入偏少，可以适当多吃蔬菜、全谷物。',
        color: '#D4C0A8',
        textColor: '#4A4A4A'
      },
      {
        type: 6,
        title: '6型 糊状泥状',
        subtitle: '轻微腹泻',
        emoji: '🥣',
        desc: '呈糊状，边缘破碎不规则。可能由于着凉、消化不良或食物不耐受，建议饮食保持清淡、温热。',
        color: '#E8A08A', // 偏红色调
        textColor: '#FFFFFF'
      },
      {
        type: 7,
        title: '7型 水样无固体',
        subtitle: '严重腹泻',
        emoji: '💧',
        desc: '完全是水样的液体，没有固体块。可能由于肠道细菌感染、食物中毒或极度受凉导致，请注意补充电解质并及时就医。',
        color: '#D07A70',
        textColor: '#FFFFFF'
      }
    ]
  },

  methods: {
    selectType(e) {
      const type = parseInt(e.currentTarget.dataset.type, 10);
      this.triggerEvent('change', { type });
    }
  }
});